<#
Reads the API/web endpoints actually embedded in a built SynTrack client
(an .msix, or SynTrack.Client.dll) and fails unless both are trusted
production endpoints: absolute https, host not localhost / loopback.

Why this exists: the first Microsoft Store submission was packed from a
working copy whose endpoints were http://localhost:4000/api and
http://localhost:5173. The package installed fine, but every
certification machine saw "Could not connect this client." Source
defaults are not evidence - only the shipped binary is.

The values live in [AssemblyMetadata] custom-attribute blobs
(SynTrack.Client.csproj). The blob layout is fixed by ECMA-335 II.23.3:
  01 00 | SerString key | SerString value | 00 00
so this reads them without loading the assembly (Windows PowerShell 5.1
cannot load a net8 assembly for reflection).

Usage:
  powershell -File scripts/release/verify-client-endpoints.ps1 -Path apps/client/msix/Output/SynTrack-0.1.1.msix
  powershell -File scripts/release/verify-client-endpoints.ps1 -Path <publishDir>/SynTrack.Client.dll
  ... -AllowInsecure   # intentional local sideload build only: report, do not fail
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $Path,
    [switch] $AllowInsecure
)

$ErrorActionPreference = "Stop"

function Get-ClientDllBytes {
    param([string] $InputPath)

    $resolved = (Resolve-Path $InputPath).Path

    if ($resolved -match '\.(msix|appx)$') {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::OpenRead($resolved)
        try {
            $entry = $zip.Entries | Where-Object { $_.FullName -eq "SynTrack.Client.dll" } | Select-Object -First 1
            if ($null -eq $entry) {
                throw "SynTrack.Client.dll not found at the root of $resolved"
            }

            $stream = $entry.Open()
            try {
                $buffer = New-Object System.IO.MemoryStream
                $stream.CopyTo($buffer)
                return , $buffer.ToArray()
            }
            finally {
                $stream.Dispose()
            }
        }
        finally {
            $zip.Dispose()
        }
    }

    return , [System.IO.File]::ReadAllBytes($resolved)
}

function Read-CompressedLength {
    param([byte[]] $Bytes, [int] $Offset)

    $first = $Bytes[$Offset]
    if (($first -band 0x80) -eq 0) {
        return @($first, 1)
    }

    if (($first -band 0xC0) -eq 0x80) {
        return @(((($first -band 0x3F) -shl 8) -bor $Bytes[$Offset + 1]), 2)
    }

    throw "Unsupported metadata string length encoding at offset $Offset"
}

function Get-AssemblyMetadataValue {
    param([byte[]] $Bytes, [string] $Key)

    $keyBytes = [System.Text.Encoding]::UTF8.GetBytes($Key)
    $found = @()

    for ($i = 3; $i -le $Bytes.Length - $keyBytes.Length - 1; $i++) {
        # Prolog 01 00 + one-byte key length immediately before the key.
        if ($Bytes[$i - 3] -ne 1 -or $Bytes[$i - 2] -ne 0 -or $Bytes[$i - 1] -ne $keyBytes.Length) {
            continue
        }

        $match = $true
        for ($k = 0; $k -lt $keyBytes.Length; $k++) {
            if ($Bytes[$i + $k] -ne $keyBytes[$k]) {
                $match = $false
                break
            }
        }

        if (-not $match) {
            continue
        }

        $valueOffset = $i + $keyBytes.Length
        if ($Bytes[$valueOffset] -eq 0xFF) {
            $found += , $null
            continue
        }

        $length, $width = Read-CompressedLength -Bytes $Bytes -Offset $valueOffset
        $found += [System.Text.Encoding]::UTF8.GetString($Bytes, $valueOffset + $width, $length)
    }

    if ($found.Count -ne 1) {
        throw "Expected exactly one [AssemblyMetadata(`"$Key`", ...)] in SynTrack.Client.dll, found $($found.Count)."
    }

    return $found[0]
}

function Test-TrustedProductionUrl {
    param([string] $Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return $false
    }

    $uri = $null
    if (-not [System.Uri]::TryCreate($Url.Trim(), [System.UriKind]::Absolute, [ref] $uri)) {
        return $false
    }

    if ($uri.Scheme -ne "https" -or [string]::IsNullOrEmpty($uri.Host)) {
        return $false
    }

    $hostName = $uri.Host.Trim('[', ']')
    if ($uri.IsLoopback -or $hostName -eq "localhost" -or $hostName.EndsWith(".localhost") -or $hostName -eq "0.0.0.0") {
        return $false
    }

    $address = $null
    if ([System.Net.IPAddress]::TryParse($hostName, [ref] $address) -and [System.Net.IPAddress]::IsLoopback($address)) {
        return $false
    }

    return $true
}

$bytes = Get-ClientDllBytes -InputPath $Path

$api = Get-AssemblyMetadataValue -Bytes $bytes -Key "SynTrackApiBaseUrl"
$web = Get-AssemblyMetadataValue -Bytes $bytes -Key "SynTrackWebBaseUrl"
$allowFlag = $null
try {
    $allowFlag = Get-AssemblyMetadataValue -Bytes $bytes -Key "SynTrackAllowInsecureEndpoints"
}
catch {
    $allowFlag = "<absent: pre-0.1.1 build>"
}

$apiOk = Test-TrustedProductionUrl -Url $api
$webOk = Test-TrustedProductionUrl -Url $web

Write-Host "Embedded endpoints ($Path)"
Write-Host "  SynTrackApiBaseUrl:             $api  [$(if ($apiOk) { 'OK' } else { 'NOT PRODUCTION' })]"
Write-Host "  SynTrackWebBaseUrl:             $web  [$(if ($webOk) { 'OK' } else { 'NOT PRODUCTION' })]"
Write-Host "  SynTrackAllowInsecureEndpoints: $allowFlag"

if ($apiOk -and $webOk -and $allowFlag -ne "true") {
    Write-Host "Endpoint verification: PASS"
    exit 0
}

if ($AllowInsecure) {
    Write-Warning "Endpoint verification: NOT a production build (allowed by -AllowInsecure). Never submit this package to the Store."
    exit 0
}

[Console]::Error.WriteLine("Endpoint verification: FAIL - this build must not be distributed or submitted to the Microsoft Store.")
exit 1
