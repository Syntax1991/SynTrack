# SynTrack Client

A native Windows desktop app (C# / .NET 8 / WPF) that watches your WoW
`SavedVariables` folder and syncs `SynTrack_Core.lua` /
`SynTrack_Professions.lua` (or the legacy `ProfessionTracker.lua`, only
when the canonical file is absent) to the SynTrack API. It never parses
Lua itself - it reads, hashes, and uploads the raw file content; the
existing backend `LuaSavedVariablesParser` remains the only parser.

`SynTrack_Guild.lua` is intentionally excluded from automatic sync.

## Sign in with Battle.net

The client authenticates entirely through the browser - there is no
embedded browser and no Battle.net login UI inside the WPF app itself:

1. Click **Sign in with Battle.net**. The client asks the SynTrack API
   for a device-link request (`POST /api/client/link`) and opens your
   **system default browser** to the SynTrack web app's Settings page.
2. If you aren't already signed in there, the web app runs its existing
   Battle.net OAuth login. Once signed in, approving the device link
   binds it to your authenticated SynTrack account server-side
   (`DeviceLinkService.approve`, which re-verifies the raider session -
   the browser gating is presentation only, not the real check).
3. The client polls in the background and, the moment the link is
   approved, receives and stores its own `DeviceCredential` - a
   SynTrack-issued secret, not your Battle.net password or OAuth token.
4. The UI transitions to **Connected** automatically and loads your
   `BattleTag` and character roster - no manual code entry required.

The short `userCode` shown to the browser tab is a diagnostic fallback
only (small, de-emphasized text); it is not the primary UX.

**Sign out** clears the local `DeviceCredential` and returns the client
to the signed-out state. It does not log you out of Battle.net or the
web app in your browser - only this device's SynTrack access is revoked
locally. (Server-side revocation via `POST /api/client/devices/:id/revoke`
would need a raider session the desktop client doesn't hold today, so
sign-out is local-only for now.)

### Account identity (`BattleTag`)

`GET /api/client/me` resolves the presented `DeviceCredential` to the
`RaiderAccount` that approved it and returns its current `battleTag`,
live - the desktop client never fabricates it and never persists a
copy. A `DeviceCredential` issued before this feature existed has no
linked account yet; the client then shows **Connected** with an
"Account identity unavailable" caption instead of a fake name - signing
out and back in re-links it.

### Character roster

`GET /api/client/characters` returns the same character list SynTrack
already tracks (SynTrack's personal data model is single-tenant - see
`ClientCharactersService` for why there is no per-account roster
filtering, only ordinary device-credential validity). Each row's item
level reuses `GearReadinessService`'s existing average-item-level
computation and its "last synced" timestamp is the most recent addon
capture (`CharacterGearSlot`/`CharacterResourceSnapshot`) SynTrack has
on file - never an unrelated `updatedAt`-style timestamp. Item level and
last-sync are both `null` (shown as "-" / "Never") rather than fabricated
when nothing has been captured yet. A failed roster fetch surfaces only
as an inline message in the roster panel; it never stops the
SavedVariables watcher or sync pipeline, which are entirely independent.

## Architecture

```
SynTrack.Client.sln
  SynTrack.Client/            WPF application
    Views/                    XAML views (MainWindow - a single wide
                               dashboard: header, left status sidebar,
                               right character roster; no tabs)
    ViewModels/                MVVM view models (CommunityToolkit.Mvvm)
    Services/                  WoW discovery, account discovery, file
                                watcher, hashing/dedup, device-link,
                                credential storage, HTTP client, tray,
                                autostart, settings, logging
    Models/                    Plain data types shared across the app
    Infrastructure/            WPF value converters
    Themes/                    Colors.xaml / Controls.xaml - the shared
                                visual language (dark background, purple
                                accent, status colors, reusable button/
                                text/surface styles), mirrors
                                apps/web/src/styles/tokens.css
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
  shown as a diagnostic fallback.
- Battle.net credentials and OAuth tokens never reach the desktop app at
  all - the browser/web backend own that exchange exclusively; the
  client only ever handles its own `DeviceCredential`.
- All authenticated HTTP (`POST /api/client/import`,
  `POST /api/client/link/status`, `GET /api/client/me`,
  `GET /api/client/characters`) happens inside `SynTrackApiClient`. The
  raw SavedVariables body is sent unchanged as `text/plain`, never
  wrapped in JSON; `GetMeAsync`/`GetCharactersAsync` fail safe (return
  `null`/empty) on any error instead of throwing, so a profile or roster
  problem can never crash the UI or disrupt sync.

## Development

```powershell
dotnet build apps/client/SynTrack.Client.sln
dotnet test apps/client/SynTrack.Client.sln
dotnet run --project apps/client/SynTrack.Client
```

Or from the repo root: `npm run client:build`, `npm run client:test`.

If Windows Smart App Control (or another application control policy)
blocks the raw `SynTrack.Client.exe`/test executable from running, use
the framework-dependent DLL through the shared host instead - this is a
normal, sanctioned way to run a .NET app and does not require disabling
any security feature:

```powershell
dotnet apps/client/SynTrack.Client/bin/Release/net8.0-windows/SynTrack.Client.dll
```

## Local packaging

```powershell
dotnet build apps/client/SynTrack.Client.sln -c Release
```

Code signing for distribution is out of scope for now - this produces an
unsigned local build only.
