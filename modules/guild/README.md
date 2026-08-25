# Guild

Guild organization and persistent guild state.

## Capabilities

All seven originally planned capabilities are implemented. Gear Audit
was added afterward as a WoWAudit-inspired extension, then merged
into Roster as a tabbed "Audit" experience (see below) — it is no
longer a separate nav entry:

- Dashboard (available)
- Roster (available, includes Gear Audit as tabs)
- Teams (available)
- Weekly Progress (available)
- Requirements (available)
- Officer Notes (available)

## Current source

- API: `modules/guild/api/roster`, `modules/guild/api/roster-import`,
  `modules/guild/api/verification`, `modules/guild/api/teams`,
  `modules/guild/api/requirements`, `modules/guild/api/officer-notes`,
  `modules/guild/api/weekly-progress`,
  `modules/guild/api/audit`
- Web: `modules/guild/web/roster` (the only routed page — `RosterPage`
  is a 4-tab container), `modules/guild/web/audit` (tab content +
  hooks/api, composed into Roster, no route of its own),
  `modules/guild/web/verification`, `modules/guild/web/teams`,
  `modules/guild/web/requirements`, `modules/guild/web/officer-notes`,
  `modules/guild/web/weekly-progress`, `modules/guild/web/dashboard`
- Shared: `apps/web/src/shared/components/Tabs.tsx` (generic tab bar,
  also used by Professions' detail page)
- Addon: `modules/guild/addons/SynTrack_Guild`

Roster members can be managed manually or synced from the
`SynTrack_Guild` WoW addon via the roster-import endpoints. The raw
WoW officer note captured by the addon lives on `GuildMember`; the
richer Officer Notes capability (freeform, timestamped officer
commentary, see below) is a separate feature.

## Guild leadership verification

Roster, team, requirement and officer-note mutations
(create, update, delete, addon import, membership/record changes)
require a verified guild leadership link. Reading stays open
everywhere. Verification works entirely through Blizzard's official
APIs, using whichever `RaiderAccount` is currently signed in via Data
Platform's unified Raider Login
(`modules/data-platform/api/raider-auth`) — `GuildVerificationService`
resolves a live Blizzard access token per-request via
`RaiderAuthService.requireUsableAccessToken(token)`, not a shared
connection. (Until 2026-08-14 this reused a single app-owner-only
`BattleNetConnection`; that flow was retired when the user asked for
one login protecting the whole app instead of two parallel ones — see
the `project_raider_login` memory.)

1. The signed-in account's own characters are checked against
   Blizzard's Character Profile API for guild membership — this is
   the default discovery path since Blizzard doesn't support
   free-text guild *search*. Added 2026-08-14 after a WoWUtils
   screenshot ("Link Guild" by Region/Realm/Name): a second path,
   `POST /guild/verification/lookup`
   (`GuildVerificationService.lookupGuild`), looks up an exact
   realm+guild name directly via Blizzard's Guild Roster API —
   Blizzard *does* support this exact-name lookup, just not
   discovery/search — then filters that guild's roster down to the
   signed-in account's own characters. Same security model either
   way: whichever path is used, you still pick one of *your own*
   characters as proof in the next step, never someone else's.
2. The chosen character's rank is looked up in Blizzard's official
   Guild Roster API.
3. Rank `0` is always the Guild Master. Blizzard does not expose
   custom rank titles (e.g. "Officer") at all, so ranks `0`-`2` are
   treated as guild leadership by a fixed server-side policy
   (`LEADERSHIP_RANK_THRESHOLD` in
   `modules/guild/api/verification/verification.service.ts`). This
   threshold is intentionally not a client-supplied parameter —
   accepting it from the request would make the check meaningless.
4. A successful verification is persisted as a singleton
   `GuildVerification` record. Every mutating service
   (`GuildRosterService`, `GuildRosterImportService`,
   `GuildTeamService`, `GuildRequirementService`,
   `GuildOfficerNoteService`) calls the
   shared `GuildVerificationGuard.ensureVerified()` before mutating
   and rejects with `403` otherwise. On the web, every mutating page
   is wrapped in the shared `GuildVerificationGate` component, which
   shows the candidate picker until verified and renders `children`
   afterward.

Known limitation: because Blizzard never returns rank names, a real
officer placed below rank `2` will not pass verification until the
threshold is revisited. There is currently no UI to change the
threshold per guild; adjust the constant if a guild's conventions
differ.

**The verified identity card moved to Settings (2026-08-14).** The
"guild name, verified via character X" status card
(`GuildVerificationStatusCard`) used to repeat on every gated page
(Roster, Teams, Requirements, Officer Notes, Weekly Progress, Raid
Planner) plus the Dashboard, after the user asked directly to pull it
"raus aus dem normalen views" and give it a home in Settings instead.
`GuildVerificationGate` now only handles the gate itself (block until
verified, render children after) — it no longer renders the status
card at all. A new `GuildSettingsPage` (`/guild/settings`, linked from
the Guild nav and a compact Dashboard card) owns the card exclusively:
it calls `useGuildVerification` directly and shows the status card
when verified, the verify-flow panel when not — this is the only
place in the app that shows this information now. The Dashboard's old
always-visible card/access-card block was replaced with a CTA that
only renders when the guild is **not yet** verified (pointing at
Settings), so verification stays discoverable without repeating the
full card once it's done. Matches WoWAudit's own layout, confirmed via
a screenshot showing "Settings" as a dedicated tab in the guild's own
nav, separate from Overview/Roster/Audit.

**Briefly gained a second tab, then reverted (2026-08-14, same day).**
After "alles was data platform ist unter settings umziehen" (move
everything Data Platform under Settings), `GuildSettingsPage`
temporarily became a 2-tab page with Battle.net character sync
alongside Verification. This broke the personal My SynTrack Dashboard's
"Sync data" button, which links to `/battlenet` expecting a
personal-account page — it landed on a Guild-branded settings page
instead. The user then drew the actual line explicitly: **"in personal
werden Char Daten etc. Im guild dient nur zu Rechte-Verifizierung"**
(personal gets character data etc., Guild is purely for rights/
leadership verification). `GuildSettingsPage` reverted to single-purpose
verification content, no tabs — Battle.net sync moved to the personal
`SettingsPage` instead (see `modules/data-platform/README.md`'s "No
standalone nav presence" section for the full history). This is now
the durable rule for anything considered for Guild Settings: only
guild-leadership/identity concerns belong there, never per-account
data — even data-platform integrations that touch guild-adjacent
Battle.net calls.

## Roster

`GuildMember.role` (`TANK`/`HEALER`/`MELEE`/`RANGED`, nullable) is a
manually officer-set field — WoW exposes no reliable read API for a
character's actual raid role without deep spec/talent inspection, so
this follows the same pattern as `rank`: an officer sets it by hand
rather than SynTrack guessing wrong. The Roster page groups members
into role sections (Tanks/Healers/Melee DPS/Ranged DPS/Unassigned,
`modules/guild/web/roster/components/RosterRoleGroups.tsx`) and adds
a "Raid Summary" sidebar (`RosterSummarySidebar.tsx`) showing role
composition, guild-wide average item level (from the Gear Audit
fields), and an armor-type breakdown derived from each member's class
name (`modules/guild/web/roster/utils/rosterRoles.ts`). This restyle
follows the WoWUtils Group Hub → Roster screen directly (see the
`project_wowaudit_reference` memory).

## Raider Login (self-service linking)

`modules/guild/api/raider-link` lets a raider who signed in via Data
Platform's `raider-auth` (see `modules/data-platform/README.md`) claim
their own `GuildMember` roster entry — `GuildMember.linkedRaiderAccountId`
is a loose reference into Data Platform's `RaiderAccount`, following
the same cross-module convention as `RaidEvent.teamId`. This is
**not** gated by `GuildVerificationGuard`: a raider can only claim a
member whose name+realm is actually among the WoW characters on
*their own* Battle.net account (checked against the session's
character snapshot), which is self-authenticating without needing
officer approval.

`POST /guild/raider-link/resolve` matches the signed-in account's
characters against the roster by name+realm (region is implicitly
`env.BATTLENET_REGION`, since the whole app is single-region):
exactly one match auto-links; more than one returns a candidate list
for the raider to pick from (alts); zero matches means none of their
characters are on the roster yet. `POST /guild/raider-link/claim`
finalizes a pick and rejects both an unowned character and a member
already linked to a different account. `GET /guild/raider-link/me`
returns the current link, or `null`.

This was originally added 2026-08-14 as a prerequisite for the Raid
module's self-service Signups feature. The Raid product segment
(Raid Planner, Boss Rosters, Signups, Attendance, Cooldown Planning)
was removed on 2026-08-25 — see git history — but this raider-link
mechanism remains, since it's general Battle.net identity
infrastructure also used by Loot's self-service Wishlist and
Droptimizer.

The web page for this (`RaiderLinkPanel` — "which character is you?"
+ sign out) moved from `/raider-link` to a new personal `SettingsPage`
at `/settings` (2026-08-14, same pass as Guild Settings above) —
listed under My SynTrack's nav as "Settings" instead of "Guild Link",
since it's account-level, not guild-level. Old `/raider-link` and
`/guild/raider-link` links redirect there.

## Teams

Teams (`GuildTeam` + `GuildTeamMembership`) group existing roster
members into persistent units — e.g. a Mythic core team or a second
Heroic team — independent of any specific raid event. A member can
belong to multiple teams; each membership carries a `role`
(`MEMBER`, `SUBSTITUTE`, `LEAD`). Teams only reference roster members
by ID, so deleting a `GuildMember` cascades and removes their team
memberships too. (Prior to the 2026-08-25 removal of the Raid product
segment, a boss-specific raid roster built from a team belonged to
the Raid module rather than here — see git history.)

## Gear Audit

Inspired directly by WoWAudit's core feature (added 2026-08-14 after
explicit user feedback to model SynTrack's guild tooling on WoWAudit
and WoWUtils — see the `project_wowaudit_reference` memory for the
full context). `GuildMember` carries five nullable audit fields
(`averageItemLevel`, `missingEnchantSlots`, `totalSocketCount`,
`filledSocketCount`, `auditedAt`) populated by
`POST /guild/audit/refresh` (verification-gated): it pulls every
roster member's live equipped gear from Blizzard's Character
Equipment Summary API — using whichever `RaiderAccount` triggers the
refresh, via the same `requireUsableAccessToken` guard verification
uses — and computes the stats in
`modules/guild/api/audit/audit.stats.ts`.

Unlike Weekly Progress, this does **not** require a matching My
SynTrack `Character` — it works directly off the roster's own
`name`/`realm`, covering every member regardless of whether they're
separately tracked. The catch: `GuildMember.realm` only stores a
realm *display name*, never a Blizzard realm *slug*, so
`audit.realm-slug.ts` derives the slug with a lowercase/hyphenate
heuristic (`slugifyRealmName`). This resolves correctly for the vast
majority of realms but can miss ones with unusual characters — those
members are silently skipped (counted in `skippedMembers`) rather
than failing the whole refresh.

The enchantable-slot list intentionally excludes head/shoulder, since
whether those carry an enchant depends on expansion-specific systems
(renown, crests, ...) that come and go; including them risked false
"missing enchant" flags.

**Merged into Roster as tabs (2026-08-14)**, matching a WoWAudit
screenshot of its real multi-tab "Audit" page the user shared, after
research established Roster and Gear Audit were already one data
model (`GuildMember` carries both roster and audit fields — the split
was purely two separate pages) with no reusable tab UI in the app
yet. `RosterPage.tsx` is now a 4-tab container (`Summary` / `Gear
overview` / `Gear upgrades` / `Gear enchants`) using the new shared
`apps/web/src/shared/components/Tabs.tsx` (extracted from the
Professions detail page's bespoke tab bar, which now reuses it too).
`AuditPage.tsx` is gone; `/guild/audit` redirects to `/guild/roster`.

The refresh call already fetched every equipped item's full payload
(name, quality, per-slot enchant/socket/upgrade data) — `audit.stats.ts`
was only keeping four aggregate scalars and discarding the rest.
`computeGearSlots()` now also persists one `GuildMemberGearSlot` row
per equipped slot (unique on `[memberId, slotKey]`, full-replaced
every refresh via `replaceGearSlots`), which is what backs the new
Gear upgrades (`upgradeCurrent`/`upgradeMax`, from Blizzard's item
upgrade-track data — confirmed against a real payload, e.g. a
Heirloom showing `3/6`) and Gear enchants (per-slot ✓/✗, same
enchantable-slot rule as the aggregate count) tabs — **zero new
Blizzard calls**, same one-request-per-member refresh as before.

This surfaced a real hazard worth documenting: `GuildAuditService.refreshAll`
iterates *every* roster row and looks up live equipment by
`name`+`realm`, with no way to tell a real member from a manually
entered placeholder. A first version of the demo-guild seed
(`apps/api/prisma/seed-demo-guild.ts`) used the real "Draenor" EU
realm, and a refresh run during testing silently overwrote several
fabricated demo members' stats with unrelated real players' actual
gear — coincidental name collisions on a real, populated realm. Fixed
by seeding demo characters on `"Draenor (Demo)"` instead, which
`slugifyRealmName` turns into `draenor-demo` — not a real Blizzard
realm slug, so refresh always 404s and skips them cleanly. Anyone
adding fixture/demo `GuildMember` rows by hand should use an
obviously-fake realm for the same reason, not a real populated one.

**Still WoWAudit's full "Audit" tab set, not started**: Vault, Raids
(this week/overall/timeline), Dungeons (weekly/season), Collections,
Reputations, PvP. Nothing tracks any of these for guild members
today — see the `project_wowaudit_reference` memory for the
researched endpoint list and why each is its own future slice (new
`BattleNetClient` method + Prisma model + refresh/read endpoints +
tab, same shape as this Gear Audit build).

## Requirements

`GuildRequirement` is a list of expectations the guild sets for its
members (title, description, category —
`GEAR`/`KEYSTONE`/`ATTENDANCE`/`PROFESSION`/`OTHER`). A `GEAR`
requirement may additionally set `minimumItemLevel`; when it does,
the Requirements page cross-references it against every roster
member's `averageItemLevel` from the Gear Audit and shows a live
pass/fail count plus the names below threshold. Requirements in the
other categories (Keystone, Attendance, Profession, Other) remain
plain documentation — there's no automated compliance source for
those yet.

## Officer Notes

`GuildOfficerNote` holds freeform, timestamped commentary per guild
member, distinct from the single raw WoW officer note field captured
by the addon on `GuildMember.officerNote`. Every note is stamped with
the verified officer's character name server-side
(`GuildOfficerNoteService.create` reads it from
`GuildVerificationService.getStatus()`) — the author is never taken
from client input, so notes can't be attributed to someone who didn't
actually create them.

## Weekly Progress

Read-only cross-reference between the guild roster and My SynTrack's
per-character weekly data (`modules/my-syntrack/api/weekly-checklist`,
`modules/my-syntrack/api/vault-mythic-plus`). For each `GuildMember`,
`GuildWeeklyProgressService` looks for a `Character` with the exact
same `name`/`realm`/`region` and, if found, reports that character's
weekly checklist completion count and Mythic+ run count for the
current reset period (via the shared `getWeeklyPeriod()` helper).
Members without a matching `Character` show as "not tracked" — this
is an identity match, not an integration, so inconsistent naming
between the roster and My SynTrack breaks the link silently.

## Dashboard

`/guild` composes read models from every other capability (roster
count, team count, event count, tracked-member count, requirement
count, officer-note count, verification status) into summary cards
purely in the frontend — there is no dedicated dashboard API
endpoint beyond the existing list endpoints plus
`GET /guild/officer-notes/count`.
