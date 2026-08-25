# Agent workflow rules

## After every implementation/change task

1. Run the appropriate tests/verification for the change (at minimum
   `npm run verify` when backend/frontend code changed).
2. Sync the SynTrack WoW addon(s) to the live WoW AddOns directory:

   ```powershell
   powershell -File scripts/sync-wow-addon.ps1
   ```

   Do this even when the change didn't touch addon (Lua/toc) files —
   the live installation must stay guaranteed to match the current
   repository state, not just addon-code changes.
3. Report the addon sync result explicitly, in this shape:

   ```text
   Addon sync:
   SUCCESS
   Source: <printed by the script>
   Destination: <printed by the script>
   ```

   or:

   ```text
   Addon sync:
   FAILED
   Reason: <why>
   ```

   Never report a task as fully complete if the addon sync failed —
   say so plainly instead.

See `scripts/sync-wow-addon.ps1` for exactly what it does (mirrors
every `modules/*/addons/<AddonName>` into its own subfolder of the
resolved AddOns directory; never touches unrelated addons or the
AddOns directory itself) and `.env.example` for
`SYNTRACK_WOW_ADDONS_DIR`, the machine-specific destination override.
