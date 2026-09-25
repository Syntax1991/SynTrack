# SynTrack Windows Client Release

How to build a distributable `SynTrackClientSetup-<version>.exe` and publish
it to the self-hosted download at `/api/client-download`.

For the Microsoft Store MSIX (`apps/client/pack.ps1`), endpoint
verification, WACK, the clean-machine smoke test and the Partner Center
resubmission checklist, see [STORE_CERTIFICATION.md](STORE_CERTIFICATION.md).

The desktop connect flow also depends on the deployed web app: always
build it for deployment with `npm run build:web:production` (pins the
same-origin `/api` and fails on a loopback API in the bundle), never a
plain `npm run build` from a checkout whose `apps/web/.env` points at
the local API.

## Prerequisites

- .NET 8 SDK (`dotnet --version`)
- Node.js (used only to read/validate the release version via `npx tsx`)
- [Inno Setup 6](https://jrsoftware.org/isinfo.php) (`ISCC.exe`) - not
  auto-installed; the release script fails with a clear message if it's
  missing instead of downloading it for you
- For a signed release only: a code-signing certificate visible to Windows
  (see "Signed production release" below) and the Windows 10/11 SDK
  (`signtool.exe`)

## Version source

The one authoritative version is `SynTrack.Client.csproj`'s `<Version>`
element. The release script reads it from there by default - bump that
value for a new release rather than passing `-Version` on every run.
`-Version <x.y.z>` is available as an explicit override (e.g. for a one-off
test build) but does not update the `.csproj`.

Versions must be `MAJOR.MINOR.PATCH` (e.g. `0.1.0`, `1.2.3`). An invalid
version fails the release immediately; see
`modules/data-platform/api/client-download/client-release-version.ts` (and
its tests) for the exact contract, shared by the release script through
`scripts/release/print-client-release-info.ts`.

## Running a release

Unsigned development release (default):

```powershell
powershell -File scripts/release-client.ps1
```

This builds a real, working, unsigned installer and prints
`WARNING: Release is UNSIGNED`. No fake or self-signed certificate is ever
generated - the release is simply left unsigned.

Signed production release:

```powershell
powershell -File scripts/release-client.ps1 -SigningMode Signed -SigningThumbprint <thumbprint>
```

(or set `$env:SYNTRACK_SIGNING_CERT_THUMBPRINT` instead of passing
`-SigningThumbprint`). Signing fails the release outright if the thumbprint
isn't found in `Cert:\CurrentUser\My` or if `signtool` can't produce a
signature that then verifies as `Valid` via `Get-AuthenticodeSignature` -
it never silently falls back to an unsigned build.

Override the version for a one-off build:

```powershell
powershell -File scripts/release-client.ps1 -Version 0.2.0
```

## What the script does

1. Reads and validates the release version from the client `.csproj`.
2. Cleans `artifacts/client/<version>/` (publish/installer/checksums) -
   build output, never committed (`.gitignore`'d).
3. Validates the configured API/web endpoints aren't `localhost` (unless
   `-AllowInsecureEndpoints` is passed for an intentional local test build).
4. `dotnet publish` - Release, `win-x64`, self-contained. The Release
   build itself fails on a non-https / loopback endpoint unless
   `SynTrackAllowInsecureEndpoints=true` is passed (which
   `-AllowInsecureEndpoints` does), and the published
   `SynTrack.Client.dll` is then checked with
   `scripts/release/verify-client-endpoints.ps1`.
5. Optionally signs `SynTrack.Client.exe`.
6. Builds the installer with the existing Inno Setup script at
   `apps/client/installer/syntrack-client.iss` (per-user install under
   `%LOCALAPPDATA%\Programs\SynTrack`, Start Menu shortcut, optional desktop
   icon, no admin rights required, stable `AppId` so a newer installer
   upgrades an existing install in place rather than creating a second one).
7. Optionally signs the installer.
8. Computes its SHA-256 and writes `SynTrackClientSetup-<version>.exe.sha256`
   (`<hash>  <filename>` format).
9. Copies the installer and checksum into
   `apps/api/public/client-downloads/` (see
   `apps/api/public/client-downloads/README.md` - this directory is
   git-ignored except for that README).
10. Prints a release summary (version, size, hash, signed status, published
    path).

## How the download API picks a release

`ClientDownloadService` (see
`modules/data-platform/api/client-download/client-download.service.ts`)
serves whichever `.exe` in `apps/api/public/client-downloads/` has the
newest file-modification time - **not** the highest semantic version. In
normal use this is exactly the file the release script just copied in, so
it is always the intended release; just be aware that manually dropping in
an older build after a newer one would make that older build "latest".

## Uninstall behavior

Uninstalling only removes the install directory
(`%LOCALAPPDATA%\Programs\SynTrack`), the Start Menu shortcut, and the
registry uninstall entry. It does **not** touch
`%APPDATA%\SynTrack\Client\` (`settings.json`, `device-credential.bin`,
`sync-gate.json`, `client.log`) - the user's device link, settings, and
logs survive an uninstall/reinstall, matching the app's own
`Environment.SpecialFolder.ApplicationData` storage location (see
`App.xaml.cs`), which the installer never manages. Confirmed by an actual
silent install -> launch -> uninstall pass during release-pipeline testing.

## Certum / SimplySign signing setup (not yet active)

The release script's signing step is ready to use a real certificate but
does not activate one on its own. To turn on signed production releases:

1. Complete Certum's Open Source Code Signing in the Cloud enrollment and
   have the certificate issued.
2. Configure SimplySign so the certificate is usable from this machine's
   Windows certificate/signing tooling.
3. Confirm the certificate appears under `Cert:\CurrentUser\My` as a
   code-signing certificate (`Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert`)
   and note its thumbprint.
4. Run the release with `-SigningMode Signed -SigningThumbprint <thumbprint>`
   (or set `SYNTRACK_SIGNING_CERT_THUMBPRINT`).

No thumbprint, PIN, OTP, or SimplySign credential is hardcoded anywhere in
this repository - none of that exists yet, and none should be committed
when it does.

## Unsigned builds and SmartScreen

Windows SmartScreen may warn on an unsigned installer; this is expected and
not something to work around. Signing removes the "unknown publisher"
warning once a certificate is configured, but SmartScreen's own reputation
system can still take time to build up trust for a new signed binary -
signing does not guarantee an immediate green light.
