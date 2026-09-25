# Microsoft Store Certification

Procedure for building, verifying and resubmitting the SynTrack MSIX to
Microsoft Partner Center. See [RELEASE.md](RELEASE.md) for the
self-hosted Inno Setup release.

## Why the 0.1.0 submission failed (policy 10.1.2.10 Functionality)

The tester saw **"Could not connect this client."** on the signed-out
screen after clicking **Continue with Battle.net**. Two production
defects combined:

1. **The rejected `SynTrack-0.1.0.msix` embedded development endpoints.**
   Its `SynTrack.Client.dll` carried
   `[AssemblyMetadata("SynTrackApiBaseUrl", "http://localhost:4000/api")]`
   and `SynTrackWebBaseUrl = http://localhost:5173`. It was packed from a
   working copy before the production defaults were committed, and
   `pack.ps1` only *warned* about localhost. On a certification machine
   nothing listens on localhost, so START failed immediately.
2. **The deployed syntrack.io web bundle also called
   `http://localhost:4000/api`.** It was built from a checkout whose
   `apps/web/.env` points `VITE_API_URL` at the local API. Even a
   correct desktop package would have opened a connect page that could
   not load the pending connection or start Battle.net sign-in.

The production API itself was healthy throughout (`POST
https://syntrack.io/api/client/connect` returns 200 with `browserUrl`,
`pollToken`, `expiresAt`; the Battle.net redirect URI is
`https://syntrack.io/api/auth/raider/callback`).

## Guards now in place

| Layer | Guard |
| --- | --- |
| MSBuild (`SynTrack.Client.csproj`) | A **Release** build fails unless `SynTrackApiBaseUrl` / `SynTrackWebBaseUrl` are absolute `https://` URLs whose host is not localhost / `*.localhost` / `127.x` / `[::1]` / `0.0.0.0`. Debug builds are unrestricted. |
| `apps/client/pack.ps1` | Refuses non-production endpoints before publishing; after packing, reads the endpoints back **out of the built MSIX** with `scripts/release/verify-client-endpoints.ps1` and deletes the package on failure. |
| `scripts/release-client.ps1` | Same verifier against the published `SynTrack.Client.dll`. |
| Runtime (`ClientEndpoints`) | A *packaged* process stamped with insecure endpoints ignores them and uses `https://syntrack.io` (logged as a warning). |
| Web (`npm run build:web:production`) | Pins `VITE_API_URL` to same-origin `/api` over any local `.env`, then fails if the bundle contains a loopback API URL. Part of `npm run verify`. |

The only intentional escape hatch is `SynTrackAllowInsecureEndpoints`
(`pack.ps1 -AllowInsecureEndpoints`, `release-client.ps1
-AllowInsecureEndpoints`, or `-p:SynTrackAllowInsecureEndpoints=true`)
for a local sideload test against a dev API. Such a package is stamped
`SynTrackAllowInsecureEndpoints=true`, which the verifier reports as
**not** a production build. **Never submit it.**

## Resubmission checklist

1. **Deploy the web app first.** On the production host build with
   `npm run build:web:production` (never a plain `npm run build` from a
   dev checkout) and deploy `apps/web/dist`. Confirm:
   ```bash
   curl -s https://syntrack.io/ | grep -o 'assets/index-[^"]*\.js'
   ```
   then fetch that file and check it contains no `localhost:4000`.
2. Bump `<Version>` in `SynTrack.Client/SynTrack.Client.csproj` if the
   previously uploaded version has to be superseded.
3. Build the Store package (unsigned - Partner Center signs it):
   ```powershell
   powershell -File apps/client/pack.ps1 -SkipSign -SkipInno
   ```
   The run must end with `Endpoint verification: PASS`.
4. Re-verify the exact file you will upload:
   ```powershell
   powershell -File scripts/release/verify-client-endpoints.ps1 -Path apps/client/msix/Output/SynTrack-<version>.msix
   ```
5. Run the Windows App Certification Kit from an **elevated** prompt:
   ```powershell
   & "${env:ProgramFiles(x86)}\Windows Kits\10\App Certification Kit\appcert.exe" test -appxpackagepath "<full path to .msix>" -reportoutputpath "$env:TEMP\syntrack-wack.xml"
   ```
   Open the report; `OVERALL_RESULT` must be `PASS`.
6. Prepare the reviewer account (see "Reviewer account" below).
7. Run the clean-machine smoke test below, signed in as that account.
8. Upload the `.msix`, paste the Additional Testing Information below,
   and record the package SHA-256 (`Get-FileHash`) in the PR / release
   notes.

## Clean-machine smoke test

Use a clean Windows VM or a fresh Windows user profile - no repo, no
local API / Vite server, no `%APPDATA%\SynTrack\Client\device-credential.bin`.
An unsigned Store package cannot be sideloaded; test either the
Partner Center flight / private-audience build, or a copy packed and
signed with a trusted test certificate from the same tree.

1. Install the package; launch SynTrack.
2. Signed-out screen is shown.
3. Click **Continue with Battle.net** - the default browser opens on
   `https://syntrack.io/client/connect?...` and shows the pending
   connection (not "Connection request not found").
4. Sign in with Battle.net and approve the desktop connection.
5. The desktop client turns **Connected**, shows the BattleTag, and the
   character roster loads.
6. Restart the client - the session restores (DPAPI credential).
7. WoW install discovery, folder browse, account selection and the
   SavedVariables watcher work.
8. **Disconnect** returns to signed-out; **Continue with Battle.net**
   connects again.
9. With the network unplugged, **Continue with Battle.net** shows
   "SynTrack is currently unreachable. Check your internet connection
   and try again."

If `client.log` (`%APPDATA%\SynTrack\Client\`, or the package's
virtualized AppData) is needed for support, it contains only operation
categories, HTTP status, token-free endpoints, version and packaged
state - never tokens or credentials.

## Partner Center - Additional Testing Information

Paste as-is:

```text
SynTrack requires an active internet connection for account linking.

Testing steps:

1. Launch SynTrack.
2. Click "Continue with Battle.net".
3. SynTrack requests a secure device connection from the production
   SynTrack service.
4. The system default browser opens automatically.
5. Complete Battle.net authentication.
6. Approve the SynTrack desktop connection in the browser.
7. Return to SynTrack.
8. The desktop client automatically becomes connected and displays the
   linked account and character information.

Production website:
https://syntrack.io

The SynTrack desktop client does not store the user's Battle.net password
or Battle.net OAuth tokens.

The production SynTrack service must be reachable during certification.

Note on the previous submission: the earlier package was built against
development endpoints, which caused "Could not connect this client."
This version is built and verified against the production SynTrack
service (https://syntrack.io).
```

### Reviewer account (required - account approval)

New SynTrack accounts are created **pending admin approval**
(`raider-auth-callback.service.ts`; only admin identities are
auto-approved). Until approved, the pending desktop connection is not
bound - a tester signing in with their own Battle.net account would see
"awaiting approval" in the browser and the desktop would eventually show
"Connection expired. Start a new connection." That fails 10.1.2.10 again.

So, for every submission, **one** of:

- **Preferred:** a dedicated Battle.net test account whose SynTrack
  account is already registered and approved. Enter its Battle.net
  login **only** in the Partner Center "Notes for certification" field of
  that submission (never in this repository, the package, or a public
  channel), and add to the testing text: *"Use the Battle.net test
  account provided in the certification notes."* Rotate its password
  after certification.
- Or keep an admin available to approve the tester's account promptly
  under Admin -> Users during the certification window, and add to the
  testing text: *"New accounts require approval by a SynTrack
  administrator; approval is granted promptly during certification."*
  This is less reliable: the tester may give up first.

No reviewer bypass, hidden test mode or hardcoded account exists or
should be added.
