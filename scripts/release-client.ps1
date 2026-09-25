<#
SynTrack Windows client release pipeline.

SOURCE -> version -> publish -> (optional sign) -> Inno Setup installer ->
(optional sign) -> SHA-256 -> apps/api/public/client-downloads/

Reuses the existing Inno Setup script at apps/client/installer/syntrack-client.iss
(per-user install under %LOCALAPPDATA%\Programs\SynTrack, Start Menu shortcut,
optional desktop icon, stable AppId so a newer installer upgrades in place,
standard Windows uninstall entry) instead of introducing new installer tooling.

The version comes from SynTrack.Client.csproj's <Version> element - the one
authoritative product version - via scripts/release/print-client-release-info.ts,
which is unit-tested at
modules/data-platform/api/client-download/client-release-version.test.ts.

Signing is OFF by default (UNSIGNED DEVELOPMENT RELEASE): the script builds a
real, working, unsigned installer and prints a clear warning. Pass
-SigningMode Signed with a certificate thumbprint already present in
Cert:\CurrentUser\My (e.g. a Certum Open Source Code Signing certificate made
available through SimplySign) for a SIGNED PRODUCTION RELEASE. There is no
self-signed fallback - signing either uses a real configured certificate and
is verified afterwards, or the release stays unsigned. It never silently
degrades from one to the other.

Usage:
  powershell -File scripts/release-client.ps1
  powershell -File scripts/release-client.ps1 -Version 0.2.0
  powershell -File scripts/release-client.ps1 -SigningMode Signed -SigningThumbprint <thumbprint>
#>

[CmdletBinding()]
param(
    [string] $Version = "",
    [ValidateSet("Unsigned", "Signed")]
    [string] $SigningMode = "Unsigned",
    [string] $SigningThumbprint = $env:SYNTRACK_SIGNING_CERT_THUMBPRINT,
    [string] $ApiBaseUrl = "https://syntrack.io/api",
    [string] $WebBaseUrl = "https://syntrack.io",
    [string] $DownloadDirectory = "",
    [switch] $AllowInsecureEndpoints
)

$ErrorActionPreference = "Stop"

# --- Paths -------------------------------------------------------------------

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$clientProject = Join-Path $repoRoot "apps/client/SynTrack.Client/SynTrack.Client.csproj"
$versionScript = Join-Path $repoRoot "scripts/release/print-client-release-info.ts"
$issPath = Join-Path $repoRoot "apps/client/installer/syntrack-client.iss"
$setupIcon = Join-Path $repoRoot "apps/client/SynTrack.Client/Assets/syntrack.ico"

if ([string]::IsNullOrWhiteSpace($DownloadDirectory)) {
    $DownloadDirectory = Join-Path $repoRoot "apps/api/public/client-downloads"
}

foreach ($required in @($clientProject, $versionScript, $issPath, $setupIcon)) {
    if (-not (Test-Path $required)) {
        throw "Required file not found: $required"
    }
}

# --- 1. Preflight --------------------------------------------------------------

Write-Host "== SynTrack Client Release =="

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw "dotnet SDK not found on PATH."
}

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx (Node.js) not found on PATH; required to read/validate the release version."
}

# --- 2. Read/validate version ---------------------------------------------------

$versionArgs = @("tsx", $versionScript, "--csproj", $clientProject)
if (-not [string]::IsNullOrWhiteSpace($Version)) {
    $versionArgs += "--version=$Version"
}

$releaseInfoJson = & npx @versionArgs
if ($LASTEXITCODE -ne 0) {
    throw "Failed to determine/validate the release version."
}

$releaseInfo = $releaseInfoJson | ConvertFrom-Json
$version = $releaseInfo.version
$installerFileName = $releaseInfo.installerFileName
$checksumFileName = $releaseInfo.checksumFileName

Write-Host "Release version:      $version"
Write-Host "Installer filename:   $installerFileName"

# --- 3. Clean release staging directory ------------------------------------------

$stagingRoot = Join-Path $repoRoot "artifacts/client/$version"
$publishDir = Join-Path $stagingRoot "publish"
$installerOutputDir = Join-Path $stagingRoot "installer"
$checksumDir = Join-Path $stagingRoot "checksums"

if (Test-Path $stagingRoot) {
    Remove-Item -Recurse -Force $stagingRoot
}
New-Item -ItemType Directory -Force -Path $publishDir, $installerOutputDir, $checksumDir | Out-Null

# --- 5. Production config safety (checked before publishing) ---------------------

foreach ($url in @($ApiBaseUrl, $WebBaseUrl)) {
    if (($url -match "localhost" -or $url -match "127\.0\.0\.1") -and -not $AllowInsecureEndpoints) {
        throw "Refusing to build a release against a localhost endpoint ($url). Pass -AllowInsecureEndpoints for an intentional local test build."
    }
}

Write-Host "API endpoint:         $ApiBaseUrl"
Write-Host "Web endpoint:         $WebBaseUrl"

# --- 4. Production client build ---------------------------------------------------

dotnet publish $clientProject `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:Version=$version `
    -p:PublishDir=$publishDir `
    -p:DebugType=None `
    -p:DebugSymbols=false `
    -p:SynTrackApiBaseUrl=$ApiBaseUrl `
    -p:SynTrackWebBaseUrl=$WebBaseUrl `
    -p:SynTrackAllowInsecureEndpoints=$(if ($AllowInsecureEndpoints) { "true" } else { "false" })

if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish failed (exit $LASTEXITCODE)."
}

# Read the endpoints back out of the binary that will actually ship.
$verifyArgs = @("-NoProfile", "-File", (Join-Path $repoRoot "scripts/release/verify-client-endpoints.ps1"), "-Path", (Join-Path $publishDir "SynTrack.Client.dll"))
if ($AllowInsecureEndpoints) {
    $verifyArgs += "-AllowInsecure"
}
& powershell.exe @verifyArgs
if ($LASTEXITCODE -ne 0) {
    throw "Published client does not embed the production endpoints."
}

$clientExe = Join-Path $publishDir "SynTrack.Client.exe"
if (-not (Test-Path $clientExe)) {
    throw "Publish did not produce $clientExe."
}

# Defense in depth: the resolved endpoint check above is the primary guard;
# this best-effort scan catches an endpoint or secret literal that ended up
# embedded in the published binary some other way. A hit is a warning, not a
# hard failure, since a benign match (e.g. a library's own doc string) is
# possible - it is here to be noticed, not to auto-block a real release.
$forbiddenPatterns = @("localhost", "127.0.0.1", "DATABASE_URL")
foreach ($pattern in $forbiddenPatterns) {
    $hit = Select-String -Path $clientExe -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
    if ($hit) {
        Write-Warning "Published client binary contains the string '$pattern' - verify this is expected."
    }
}

# --- Signing helpers ---------------------------------------------------------------

function Find-SignTool {
    $kits = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
    if (Test-Path $kits) {
        $found = Get-ChildItem -Path $kits -Recurse -Filter "signtool.exe" -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match '\\x64\\signtool\.exe$' } |
            Sort-Object FullName -Descending |
            Select-Object -First 1
        if ($found) {
            return $found.FullName
        }
    }

    $cmd = Get-Command signtool.exe -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    return $null
}

function Invoke-CodeSign {
    param(
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $SignTool,
        [Parameter(Mandatory = $true)][string] $Thumbprint
    )

    & $SignTool sign /fd SHA256 /sha1 $Thumbprint /tr http://timestamp.digicert.com /td SHA256 /v $Path
    if ($LASTEXITCODE -ne 0) {
        throw "signtool failed to sign $Path (exit $LASTEXITCODE)."
    }

    $signature = Get-AuthenticodeSignature -FilePath $Path
    if ($signature.Status -ne "Valid") {
        throw "Signature verification failed for $Path (status: $($signature.Status))."
    }

    Write-Host "Signed and verified: $Path (thumbprint $Thumbprint, status Valid)"
}

$signTool = $null

if ($SigningMode -eq "Signed") {
    if ([string]::IsNullOrWhiteSpace($SigningThumbprint)) {
        throw "SigningMode Signed requires a certificate thumbprint. Pass -SigningThumbprint or set SYNTRACK_SIGNING_CERT_THUMBPRINT."
    }

    $signTool = Find-SignTool
    if ($null -eq $signTool) {
        throw "signtool.exe not found. Install the Windows 10/11 SDK to sign releases."
    }

    $cert = Get-Item "Cert:\CurrentUser\My\$SigningThumbprint" -ErrorAction SilentlyContinue
    if ($null -eq $cert) {
        throw "Certificate with thumbprint $SigningThumbprint was not found in Cert:\CurrentUser\My. Configure the Certum/SimplySign signing certificate first (see apps/client/RELEASE.md)."
    }

    Write-Host "Signing enabled - SIGNED PRODUCTION RELEASE (certificate: $($cert.Subject))"
}
else {
    Write-Warning "Release is UNSIGNED"
}

# --- 6. Optionally sign application binaries ----------------------------------------

if ($SigningMode -eq "Signed") {
    Invoke-CodeSign -Path $clientExe -SignTool $signTool -Thumbprint $SigningThumbprint
}

# --- 7. Create Windows installer ------------------------------------------------------

function Find-Iscc {
    $candidates = @(
        (Join-Path ${env:ProgramFiles(x86)} "Inno Setup 6\ISCC.exe"),
        (Join-Path $env:ProgramFiles "Inno Setup 6\ISCC.exe"),
        (Join-Path $env:LocalAppData "Programs\Inno Setup 6\ISCC.exe")
    )

    foreach ($path in $candidates) {
        if (Test-Path $path) {
            return $path
        }
    }

    $cmd = Get-Command iscc.exe -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    return $null
}

$iscc = Find-Iscc
if ($null -eq $iscc) {
    throw "Inno Setup 6 (ISCC.exe) not found. Install it from https://jrsoftware.org/isinfo.php and re-run this script - SynTrack does not auto-install build tooling."
}

Write-Host "Building installer with $iscc"

& $iscc `
    "/DAppVersion=$version" `
    "/DPublishDir=$publishDir" `
    "/DSetupIcon=$setupIcon" `
    "/O$installerOutputDir" `
    $issPath

if ($LASTEXITCODE -ne 0) {
    throw "Inno Setup compile failed (exit $LASTEXITCODE)."
}

$installerPath = Join-Path $installerOutputDir $installerFileName
if (-not (Test-Path $installerPath)) {
    throw "Installer output missing: $installerPath"
}

# --- 8. Optionally sign installer -------------------------------------------------------

if ($SigningMode -eq "Signed") {
    Invoke-CodeSign -Path $installerPath -SignTool $signTool -Thumbprint $SigningThumbprint
}
else {
    $signature = Get-AuthenticodeSignature -FilePath $installerPath
    Write-Host "Installer signature status: $($signature.Status) (expected NotSigned for an unsigned release)"
}

# --- 9. Validate installer -----------------------------------------------------------------

$installerSize = (Get-Item $installerPath).Length
if ($installerSize -le 0) {
    throw "Installer at $installerPath is empty."
}

# --- 10. Compute SHA-256 ---------------------------------------------------------------------

$hash = (Get-FileHash -Path $installerPath -Algorithm SHA256).Hash.ToLowerInvariant()
$checksumPath = Join-Path $checksumDir $checksumFileName
"$hash  $installerFileName" | Set-Content -Path $checksumPath -NoNewline -Encoding ascii

# --- 11. Publish to the API client-download directory -----------------------------------------

New-Item -ItemType Directory -Force -Path $DownloadDirectory | Out-Null
Copy-Item -Path $installerPath -Destination (Join-Path $DownloadDirectory $installerFileName) -Force
Copy-Item -Path $checksumPath -Destination (Join-Path $DownloadDirectory $checksumFileName) -Force

# --- 12. Release summary -----------------------------------------------------------------------

$publishedPath = Join-Path $DownloadDirectory $installerFileName
$signedLabel = if ($SigningMode -eq "Signed") { "Yes" } else { "No" }
$signatureStatusLabel = if ($SigningMode -eq "Signed") { "Valid" } else { "UNSIGNED - Windows SmartScreen may warn" }

Write-Host ""
Write-Host "SynTrack Client Release"
Write-Host "Version:              $version"
Write-Host "Installer:            $installerFileName"
Write-Host "Size:                 $([math]::Round($installerSize / 1MB, 2)) MB"
Write-Host "SHA-256:              $hash"
Write-Host "Signed:               $signedLabel"
Write-Host "Signature status:     $signatureStatusLabel"
Write-Host "Published path:       $publishedPath"
Write-Host "Download API:         $ApiBaseUrl/client-download/file"
Write-Host "Build configuration:  Release"
Write-Host "Runtime:              win-x64, self-contained"
