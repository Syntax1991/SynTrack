# Client downloads

Drop the built desktop-client installer here, e.g.:

```
SynTrackClientSetup-1.2.3.exe
```

(see `apps/client/README.md` for how it's built). `GET /api/client-download/info` and
`GET /api/client-download/file` always serve whichever `.exe` in this directory was
modified most recently — no strict filename format is required, but including a
`-<version>.exe` suffix lets the landing page show the version number.

Installer files themselves are gitignored and must never be committed — see the root
`.gitignore`. This `README.md` is the only tracked file in this directory.
