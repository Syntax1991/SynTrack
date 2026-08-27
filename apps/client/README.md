# SynTrack Client

A native Windows desktop app (C# / .NET 8 / WPF) that watches your WoW
`SavedVariables` folder and syncs `SynTrack_Core.lua` /
`SynTrack_Professions.lua` (or the legacy `ProfessionTracker.lua`, only
when the canonical file is absent) to the SynTrack API. It never parses
Lua itself - it reads, hashes, and uploads the raw file content; the
existing backend `LuaSavedVariablesParser` remains the only parser.

`SynTrack_Guild.lua` is intentionally excluded from automatic sync.

## Architecture

```
SynTrack.Client.sln
  SynTrack.Client/            WPF application
    Views/                    XAML views (MainWindow)
    ViewModels/                MVVM view models (CommunityToolkit.Mvvm)
    Services/                  WoW discovery, account discovery, file
                                watcher, hashing/dedup, device-link,
                                credential storage, HTTP client, tray,
                                autostart, settings, logging
    Models/                    Plain data types shared across the app
    Infrastructure/            WPF value converters
  SynTrack.Client.Tests/       xUnit test project
```

### Security boundary

- The final `DeviceCredential` is owned exclusively by
  `DpapiCredentialService` - encrypted with Windows DPAPI
  (`ProtectedData`, `CurrentUser` scope) before ever touching disk. It is
  never written to `settings.json`, never logged, and no public property
  on `MainViewModel` exposes it (see `MainViewModelSecurityTests`).
- The high-entropy `deviceCode` from the device-link flow lives only
  inside `DeviceLinkService`'s local poll loop - it is never returned to
  the ViewModel, which only ever sees the short human-readable `userCode`
  shown to the user for browser approval.
- All authenticated HTTP (`POST /api/client/import`,
  `POST /api/client/link/status`) happens inside `SynTrackApiClient`; the
  raw SavedVariables body is sent unchanged as `text/plain`, never
  wrapped in JSON.

## Development

```powershell
dotnet build apps/client/SynTrack.Client.sln
dotnet test apps/client/SynTrack.Client.sln
dotnet run --project apps/client/SynTrack.Client
```

Or from the repo root: `npm run client:build`, `npm run client:test`.

## Local packaging

```powershell
dotnet build apps/client/SynTrack.Client.sln -c Release
```

Code signing for distribution is out of scope for now - this produces an
unsigned local build only.
