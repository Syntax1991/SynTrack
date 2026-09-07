# Guild

**Removed (Phase G4B, 2026-09-07).** SynTrack is not a guild-management
product; the entire Guild product surface (Dashboard, Roster, Teams,
Gear Audit, Requirements, Officer Notes, Weekly Progress, guild
leadership verification, the `SynTrack_Guild` addon) has been deleted.
See git history for the full prior implementation and the G4A/G4B
phase reports for the audit and removal rationale.

## What remains, and why

`modules/guild/api/raider-link` and `modules/guild/api/roster/roster.repository.ts`
(+ `roster.types.ts`) are the only surviving code here. They are kept
because they are genuinely **not** Guild-management functionality
despite the folder name — `GuildRaiderLinkService` resolves "which
`GuildMember` row is the signed-in Battle.net account linked to," and
Loot's self-service Wishlist and Droptimizer features use that
resolution as their actual ownership key (`LootTierPreference`/
`LootTrinketChoice`/`LootSimReport.memberId`). Removing this would
break Loot, a real, separate, non-Guild product feature — so it stays
exactly as it was, unmounted from any `/guild/**` HTTP route (nothing
calls it via HTTP anymore since the linking UI was itself dead code
already), but still imported directly by
`modules/loot/api/wishlist` and `modules/loot/api/droptimizer`.

The `GuildMember` Prisma model (and its `linkedRaiderAccountId`
column) is therefore **still required**, not dead — see the G4B
report's Prisma readiness section for the full per-model breakdown.

There is no more UI, and no more way to create a new `GuildMember` row
(the Roster create/import flow was removed) - only characters already
linked before this phase continue to resolve through Loot.
