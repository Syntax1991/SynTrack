# Publishes the self-contained SynTrack client, signs binaries when a
# code-signing certificate is available, builds an MSIX (Store / sideload)
# and the Inno Setup wizard.
#
# Signing:
#   Preferred:  $env:SYNTRACK_CODE_SIGN_PFX + $env:SYNTRACK_CODE_SIGN_PASSWORD
#   Or store:   $env:SYNTRACK_CODE_SIGN_THUMBPRINT (CurrentUser\My)
#   Fallback:   a local self-signed CN=SynTrack cert (SmartScreen will still warn
#               for the Inno EXE; MSIX sideload trusts CurrentUser\TrustedPeople)
#   Skip:       -SkipSign
#
# Defaults to https://syntrack.io. For a local API:
#   powershell -File apps/client/pack.ps1 -ApiBaseUrl http://localhost:4000/api -WebBaseUrl http://localhost:5173
#
# Usage:
#   powershell -File apps/client/pack.ps1

[CmdletBinding()]
param(
    [string] $Version = "0.1.0",
    [string] $ApiBaseUrl = "",
    [string] $WebBaseUrl = "",
    [switch] $SkipSign,
    [switch] $SkipInno
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path (Join-Path $repoRoot "apps\client\SynTrack.Client\SynTrack.Client.csproj"))) {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
}

$clientProject = Join-Path $repoRoot "apps\client\SynTrack.Client\SynTrack.Client.csproj"
$publishDir = Join-Path $repoRoot "apps\client\publish\win-x64"
$installerDir = Join-Path $repoRoot "apps\client\installer"
$issPath = Join-Path $installerDir "syntrack-client.iss"
$setupIcon = Join-Path $repoRoot "apps\client\SynTrack.Client\Assets\syntrack.ico"
$appIconPng = Join-Path $repoRoot "apps\client\SynTrack.Client\Assets\syntrack-app-icon.png"
$clientExe = Join-Path $publishDir "SynTrack.Client.exe"
$msixDir = Join-Path $repoRoot "apps\client\msix"
$manifestTemplate = Join-Path $msixDir "Package.appxmanifest"
$msixOutputDir = Join-Path $msixDir "Output"
$msixStageDir = Join-Path $msixDir "stage"

if ([string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    $ApiBaseUrl = "https://syntrack.io/api"
}
if ([string]::IsNullOrWhiteSpace($WebBaseUrl)) {
    $WebBaseUrl = "https://syntrack.io"
}

function Find-SdkTool {
    param([Parameter(Mandatory = $true)][string] $FileName)

    $kits = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
    if (Test-Path $kits) {
        $found = Get-ChildItem -Path $kits -Recurse -Filter $FileName -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match '\\x64\\' + [regex]::Escape($FileName) + '$' } |
            Sort-Object FullName -Descending |
            Select-Object -First 1
        if ($found) {
            return $found.FullName
        }
    }

    $cmd = Get-Command $FileName -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    return $null
}

function Find-SignTool { Find-SdkTool -FileName "signtool.exe" }

function Find-MakeAppx { Find-SdkTool -FileName "makeappx.exe" }

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

function ConvertTo-MsixVersion {
    param([Parameter(Mandatory = $true)][string] $Value)

    $parts = $Value.Split('.')
    while ($parts.Count -lt 4) {
        $parts += "0"
    }

    return ($parts[0..3] -join '.')
}

function Get-SigningThumbprint {
    if (-not [string]::IsNullOrWhiteSpace($env:SYNTRACK_CODE_SIGN_THUMBPRINT)) {
        return $env:SYNTRACK_CODE_SIGN_THUMBPRINT.Replace(" ", "")
    }

    if (-not [string]::IsNullOrWhiteSpace($env:SYNTRACK_CODE_SIGN_PFX)) {
        return $null
    }

    $existing = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert -ErrorAction SilentlyContinue |
        Where-Object { $_.Subject -eq "CN=SynTrack" -and $_.NotAfter -gt (Get-Date) } |
        Select-Object -First 1

    if ($existing) {
        return $existing.Thumbprint
    }

    Write-Host "No code-signing certificate configured; creating a local self-signed CN=SynTrack cert."
    Write-Host "Windows / SmartScreen will still treat the Inno publisher as untrusted until a CA Authenticode certificate is used."

    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject "CN=SynTrack" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyExportPolicy Exportable `
        -NotAfter (Get-Date).AddYears(3) `
        -HashAlgorithm SHA256

    return $cert.Thumbprint
}

function Get-PublisherSubject {
    if (-not [string]::IsNullOrWhiteSpace($env:SYNTRACK_CODE_SIGN_PFX)) {
        $password = $null
        if (-not [string]::IsNullOrWhiteSpace($env:SYNTRACK_CODE_SIGN_PASSWORD)) {
            $password = ConvertTo-SecureString $env:SYNTRACK_CODE_SIGN_PASSWORD -AsPlainText -Force
        }

        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(
            $env:SYNTRACK_CODE_SIGN_PFX,
            $password,
            [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)

        return $cert.Subject
    }

    $thumbprint = Get-SigningThumbprint
    $cert = Get-Item "Cert:\CurrentUser\My\$thumbprint"
    return $cert.Subject
}

function Trust-SideloadCertificate {
    param([Parameter(Mandatory = $true)][string] $Thumbprint)

    $source = Get-Item "Cert:\CurrentUser\My\$thumbprint" -ErrorAction SilentlyContinue
    if ($null -eq $source) {
        return
    }

    $trusted = Get-ChildItem Cert:\CurrentUser\TrustedPeople -ErrorAction SilentlyContinue |
        Where-Object { $_.Thumbprint -eq $Thumbprint }

    if ($trusted) {
        return
    }

    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store(
        [System.Security.Cryptography.X509Certificates.StoreName]::TrustedPeople,
        [System.Security.Cryptography.X509Certificates.StoreLocation]::CurrentUser)
    $store.Open("ReadWrite")
    $store.Add($source)
    $store.Close()
    Write-Host "Imported signing cert into CurrentUser\TrustedPeople ($Thumbprint)."
    Write-Host "Self-signed MSIX sideload still needs this cert in LocalMachine\\TrustedPeople (admin once)."
}

function Sign-File {
    param(
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $SignTool
    )

    $timestampArgs = @("/tr", "http://timestamp.digicert.com", "/td", "SHA256")
    $common = @("sign", "/fd", "SHA256", "/v")

    if (-not [string]::IsNullOrWhiteSpace($env:SYNTRACK_CODE_SIGN_PFX)) {
        $pfxArgs = @("/f", $env:SYNTRACK_CODE_SIGN_PFX)
        if (-not [string]::IsNullOrWhiteSpace($env:SYNTRACK_CODE_SIGN_PASSWORD)) {
            $pfxArgs += @("/p", $env:SYNTRACK_CODE_SIGN_PASSWORD)
        }

        & $SignTool @common @pfxArgs @timestampArgs $Path
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Timestamped PFX sign failed; retrying without timestamp."
            & $SignTool @common @pfxArgs $Path
        }
    }
    else {
        $thumbprint = Get-SigningThumbprint
        $shaArgs = @("/sha1", $thumbprint)
        & $SignTool @common @shaArgs @timestampArgs $Path
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Timestamped store sign failed; retrying without timestamp."
            & $SignTool @common @shaArgs $Path
        }
    }

    if ($LASTEXITCODE -ne 0) {
        throw "signtool failed for $Path (exit $LASTEXITCODE)"
    }

    Write-Host "Signed $Path"
}

function Write-MsixImages {
    param(
        [Parameter(Mandatory = $true)][string] $SourcePng,
        [Parameter(Mandatory = $true)][string] $ImagesDir
    )

    Add-Type -AssemblyName System.Drawing

    if (Test-Path $ImagesDir) {
        Remove-Item -Recurse -Force $ImagesDir
    }
    New-Item -ItemType Directory -Path $ImagesDir | Out-Null

    $source = [System.Drawing.Image]::FromFile((Resolve-Path $SourcePng))
    try {
        $bg = [System.Drawing.Color]::FromArgb(255, 3, 6, 15)

        function Save-Square {
            param([int] $Size, [string] $FileName)
            $bmp = New-Object System.Drawing.Bitmap $Size, $Size
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.Clear($bg)
            $g.DrawImage($source, 0, 0, $Size, $Size)
            $bmp.Save((Join-Path $ImagesDir $FileName), [System.Drawing.Imaging.ImageFormat]::Png)
            $g.Dispose()
            $bmp.Dispose()
        }

        Save-Square -Size 50 -FileName "StoreLogo.png"
        Save-Square -Size 44 -FileName "Square44x44Logo.png"
        Save-Square -Size 71 -FileName "Square71x71Logo.png"
        Save-Square -Size 150 -FileName "Square150x150Logo.png"

        $wide = New-Object System.Drawing.Bitmap 310, 150
        $wg = [System.Drawing.Graphics]::FromImage($wide)
        $wg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $wg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $wg.Clear($bg)
        $iconSize = 118
        $x = [int]((310 - $iconSize) / 2)
        $y = [int]((150 - $iconSize) / 2)
        $wg.DrawImage($source, $x, $y, $iconSize, $iconSize)
        $wide.Save((Join-Path $ImagesDir "Wide310x150Logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $wg.Dispose()
        $wide.Dispose()
    }
    finally {
        $source.Dispose()
    }
}

if (-not (Test-Path $setupIcon)) {
    throw "Missing application icon: $setupIcon"
}
if (-not (Test-Path $appIconPng)) {
    throw "Missing app icon PNG: $appIconPng"
}
if (-not (Test-Path $manifestTemplate)) {
    throw "Missing MSIX manifest: $manifestTemplate"
}

Write-Host "Publishing SynTrack.Client $Version (win-x64 self-contained)"
Write-Host "API: $ApiBaseUrl"
Write-Host "Web: $WebBaseUrl"
if ($ApiBaseUrl -like "http://localhost*" -or $WebBaseUrl -like "http://localhost*") {
    Write-Host "WARNING: localhost URLs are for local sideload only. Store submission needs https production -ApiBaseUrl / -WebBaseUrl."
}

if (Test-Path $publishDir) {
    Remove-Item -Recurse -Force $publishDir
}

dotnet publish $clientProject `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:Version=$Version `
    -p:PublishDir=$publishDir `
    -p:DebugType=None `
    -p:DebugSymbols=false `
    -p:SynTrackApiBaseUrl=$ApiBaseUrl `
    -p:SynTrackWebBaseUrl=$WebBaseUrl

if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish failed (exit $LASTEXITCODE)"
}

if (-not (Test-Path $clientExe)) {
    throw "Publish did not produce $clientExe"
}

$signTool = Find-SignTool
if ($SkipSign) {
    Write-Host "Signing skipped (-SkipSign)."
}
elseif ($null -eq $signTool) {
    Write-Host "WARNING: signtool.exe not found; installer/MSIX will be unsigned."
}
else {
    Sign-File -Path $clientExe -SignTool $signTool
}

$makeAppx = Find-MakeAppx
if ($null -eq $makeAppx) {
    throw "makeappx.exe not found. Install the Windows 10/11 SDK and re-run pack.ps1."
}

$msixVersion = ConvertTo-MsixVersion -Value $Version
$publisher = "CN=SynTrack"
if (-not $SkipSign) {
    $publisher = Get-PublisherSubject
}

Write-Host "Building MSIX $msixVersion publisher $publisher"

if (Test-Path $msixStageDir) {
    Remove-Item -Recurse -Force $msixStageDir
}
New-Item -ItemType Directory -Path $msixStageDir | Out-Null
New-Item -ItemType Directory -Path $msixOutputDir -Force | Out-Null

Copy-Item -Path (Join-Path $publishDir "*") -Destination $msixStageDir -Recurse
Write-MsixImages -SourcePng $appIconPng -ImagesDir (Join-Path $msixStageDir "Images")

$manifest = Get-Content -Raw -Path $manifestTemplate
$manifest = $manifest.Replace('Publisher="CN=SynTrack"', "Publisher=`"$publisher`"")
$manifest = $manifest.Replace('Version="0.1.0.0"', "Version=`"$msixVersion`"")
$manifestPath = Join-Path $msixStageDir "AppxManifest.xml"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($manifestPath, $manifest, $utf8NoBom)

$msixPath = Join-Path $msixOutputDir "SynTrack-$Version.msix"
if (Test-Path $msixPath) {
    Remove-Item -Force $msixPath
}

& $makeAppx pack /d $msixStageDir /p $msixPath /o
if ($LASTEXITCODE -ne 0) {
    throw "makeappx failed (exit $LASTEXITCODE)"
}

if (-not $SkipSign -and $null -ne $signTool) {
    Sign-File -Path $msixPath -SignTool $signTool
    if ([string]::IsNullOrWhiteSpace($env:SYNTRACK_CODE_SIGN_PFX)) {
        Trust-SideloadCertificate -Thumbprint (Get-SigningThumbprint)
    }
}

if (-not $SkipInno) {
    $iscc = Find-Iscc
    if ($null -eq $iscc) {
        Write-Host "Inno Setup 6 not found; attempting winget install JRSoftware.InnoSetup"
        winget install --id JRSoftware.InnoSetup --exact --accept-package-agreements --accept-source-agreements
        $iscc = Find-Iscc
    }

    if ($null -eq $iscc) {
        throw "ISCC.exe not found. Install Inno Setup 6 or pass -SkipInno."
    }

    Write-Host "Building installer with $iscc"
    & $iscc `
        "/DAppVersion=$Version" `
        "/DPublishDir=$publishDir" `
        "/DSetupIcon=$setupIcon" `
        $issPath

    if ($LASTEXITCODE -ne 0) {
        throw "Inno Setup compile failed (exit $LASTEXITCODE)"
    }

    $setupExe = Join-Path $installerDir "Output\SynTrackClientSetup-$Version.exe"
    if (-not (Test-Path $setupExe)) {
        throw "Installer output missing: $setupExe"
    }

    if (-not $SkipSign -and $null -ne $signTool) {
        Sign-File -Path $setupExe -SignTool $signTool
    }

    Write-Host "Setup: $setupExe"
}

Write-Host "MSIX: $msixPath"
Write-Host "Client: $clientExe"
Write-Host "Sideload: Add-AppxPackage -Path `"$msixPath`""
Write-Host "Self-signed sideload: admin-import the CN=SynTrack cert into LocalMachine\\TrustedPeople, or upload the MSIX to Partner Center (Microsoft re-signs)."
if ($ApiBaseUrl -like "http://localhost*") {
    Write-Host "Localhost API loopback (after install): CheckNetIsolation.exe LoopbackExempt -a -n=(Get-AppxPackage SynTrack.Client).PackageFamilyName"
}
