<#
.SYNOPSIS
  Deploys every SynTrack WoW addon from modules/*/addons/<AddonName> into the
  live WoW AddOns directory.

.DESCRIPTION
  Discovers addon source directories the same way scripts/check-wow-addons.mjs
  validates them (any modules/<slug>/addons/<AddonName> containing a .toc),
  then mirrors each one into its own same-named subfolder of the resolved
  AddOns directory: copies new/changed files and deletes destination files
  that no longer exist in source, so stale addon code can never survive a
  sync. No other addon folder under AddOns is ever read, written, or deleted,
  and the AddOns directory itself is only ever created, never removed.

  Destination resolution order:
    1. $env:SYNTRACK_WOW_ADDONS_DIR
    2. SYNTRACK_WOW_ADDONS_DIR= in a repo-root .env (gitignored; see
       .env.example for the machine-specific value expected here)
    3. An auto-discovered local fallback, with a warning

.EXAMPLE
  pwsh -File scripts/sync-wow-addon.ps1
#>

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

function Resolve-AddonsDestination {
    if ($env:SYNTRACK_WOW_ADDONS_DIR) {
        return $env:SYNTRACK_WOW_ADDONS_DIR
    }

    $envFile = Join-Path $repoRoot ".env"

    if (Test-Path $envFile) {
        $line = Get-Content $envFile |
            Where-Object { $_ -match '^\s*SYNTRACK_WOW_ADDONS_DIR\s*=\s*(.+?)\s*$' } |
            Select-Object -First 1

        if ($line) {
            $value = $Matches[1]

            if ($value) {
                return $value
            }
        }
    }

    $fallback = "C:\Program Files (x86)\World of Warcraft\_retail_\Interface\AddOns"

    Write-Warning "SYNTRACK_WOW_ADDONS_DIR is not set; falling back to the auto-discovered path: $fallback"
    Write-Warning "Set SYNTRACK_WOW_ADDONS_DIR in a repo-root .env (see .env.example) to make this explicit for this machine."

    return $fallback
}

$destinationRoot = Resolve-AddonsDestination

if (-not (Test-Path $destinationRoot -PathType Container)) {
    Write-Error "WoW AddOns directory could not be resolved: '$destinationRoot' does not exist."
    exit 1
}

$destinationRootFull = (Resolve-Path $destinationRoot).Path

# The one hard safety gate: whatever path we resolved must actually be an
# "AddOns" folder. A misconfigured env var or .env value must fail loudly
# here rather than silently writing into (and cleaning files from) some
# unrelated directory.
if ((Split-Path -Leaf $destinationRootFull) -ne "AddOns") {
    Write-Error "Resolved destination '$destinationRootFull' does not look like a WoW AddOns directory (expected the final path segment to be 'AddOns')."
    exit 1
}

$addonSources = Get-ChildItem -Path (Join-Path $repoRoot "modules") -Directory |
    ForEach-Object {
        $addonsDir = Join-Path $_.FullName "addons"

        if (Test-Path $addonsDir -PathType Container) {
            Get-ChildItem -Path $addonsDir -Directory
        }
    } |
    Where-Object {
        (Get-ChildItem -Path $_.FullName -Filter "*.toc" -File | Select-Object -First 1)
    }

if (-not $addonSources -or @($addonSources).Count -eq 0) {
    Write-Error "No SynTrack addon source directories were found under modules/*/addons/*."
    exit 1
}

Write-Output "WoW AddOns destination: $destinationRootFull"

$failed = $false
$syncedCount = 0

foreach ($addon in $addonSources) {
    $addonName = $addon.Name
    $sourcePath = $addon.FullName
    $destinationPath = Join-Path $destinationRootFull $addonName

    Write-Output ""
    Write-Output "Addon: $addonName"
    Write-Output "  Source:      $sourcePath"
    Write-Output "  Destination: $destinationPath"

    try {
        if (-not (Test-Path $destinationPath -PathType Container)) {
            New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
        }

        # Development-only files (README.md, etc.) never ship into the live
        # addon folder — only what the addon itself actually loads.
        $sourceFiles = Get-ChildItem -Path $sourcePath -Recurse -File |
            Where-Object { $_.Extension -ne ".md" }

        $sourceRelativePaths = @()

        foreach ($file in $sourceFiles) {
            $relative = $file.FullName.Substring($sourcePath.Length + 1)
            $sourceRelativePaths += $relative.ToLowerInvariant()

            $targetFile = Join-Path $destinationPath $relative
            $targetDir = Split-Path -Parent $targetFile

            if (-not (Test-Path $targetDir -PathType Container)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }

            Copy-Item -Path $file.FullName -Destination $targetFile -Force
        }

        $existingFiles = Get-ChildItem -Path $destinationPath -Recurse -File
        $removedCount = 0

        foreach ($existing in $existingFiles) {
            $relative = $existing.FullName.Substring($destinationPath.Length + 1)

            if ($sourceRelativePaths -notcontains $relative.ToLowerInvariant()) {
                Remove-Item -Path $existing.FullName -Force
                $removedCount += 1
                Write-Output "  Removed obsolete file: $relative"
            }
        }

        Write-Output "  Result: OK ($($sourceFiles.Count) files copied, $removedCount removed)"
        $syncedCount += 1
    }
    catch {
        Write-Output "  Result: FAILED - $($_.Exception.Message)"
        $failed = $true
    }
}

if ($failed) {
    Write-Error "Addon sync failed for one or more addons."
    exit 1
}

Write-Output ""
Write-Output "Addon sync completed successfully for $syncedCount addon(s)."
exit 0
