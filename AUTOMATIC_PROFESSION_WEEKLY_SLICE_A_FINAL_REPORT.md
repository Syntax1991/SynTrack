# SLICE A — Automatic Profession Weekly State — Final Report

## 1. Git
- Branch: `feature/profession-weekly-auto`, created from a fully up-to-date `master` (PR #4 Bulk Tags was already merged before this branch existed).
- 9 focused commits, pushed to origin.
- PR: [#6 "feat: automate profession weekly tracking"](https://github.com/Syntax1991/SynTrack/pull/6) — **DRAFT**.
- `scripts/dev-manager.services.mjs`: untouched throughout (verified via `git status` before every commit).

Commits:
1. `feat: add profession weekly source definitions and status derivation`
2. `feat: capture automatic profession weekly state via addon import`
3. `feat: surface automatic profession weekly status in Overview and Data Health`
4. `feat: show profession weekly status on Character Detail`
5. `fix: don't show a profession the character doesn't actually have in Prof KP`
6. `feat: enable live-verified profession weekly sources`
7. `feat: add automatic Prof KP/Drops columns to the Weekly Checklist`
8. `feat: add automatic Prof KP/Drops columns to Overview`

## 2. Definitions
22 `ProfessionWeeklySourceDefinition` rows seeded (11 professions × Weekly Quest + Treatise).

**Enabled (live-verified 2026-08-29):** alchemy, blacksmithing, enchanting, engineering, inscription, jewelcrafting, leatherworking, tailoring — 16 rows.

**Disabled (no live evidence — no logged-in character has these professions):** herbalism, mining, skinning — 6 rows.

Knowledge Drops: zero definitions seeded. No known persistent per-source evidence exists yet for it (see the original audit); the addon does not capture it at all. This is documented, not an oversight.

## 3. Addon
`SynTrack_Professions` (`ProfessionWeeklyCatalog.lua` + `ProfessionWeeklyCapture.lua`) captures raw quest-flag evidence via `C_QuestLog.IsQuestFlaggedCompleted` per candidate quest ID — never the `OnAccount` variant. Capture re-runs on every `PLAYER_ENTERING_WORLD` (login, reload, and every dungeon loading screen), not just initial login.

Quest-ID catalog was corrected mid-slice from a user-supplied reference table (93690–93714) after the first live test showed the original forum-sourced IDs were wrong. Confirmed byte-identical between source and the deployed live AddOns copy at time of the final live test.

## 4. Backend
- `ProfessionWeeklySourceDefinition` (config, season-scoped) + `CharacterProfessionWeeklySnapshot` (raw fact, one row per character/source/weekly-period) — mirrors the `ResourceDefinition`/`CharacterResourceSnapshot` pattern exactly, per the architecture audit's own recommendation.
- Addon-import pipeline extended (not a second importer): normalize → persist, skipping any source without a matching *enabled* definition.
- `ProfessionWeeklyDefinitionService` / `ProfessionWeeklyStatusService` compute per-character, per-profession status from raw snapshots for the current weekly period only.
- **Bug found and fixed during live acceptance**: `ProfessionWeeklyStatusService` originally iterated every enabled definition for every character regardless of which professions that character actually has, producing phantom `UNKNOWN` entries (a 2-profession character showed all 8 enabled professions). Fixed by joining through the character's real `CharacterProfession` rows; regression test added.
- Zero C# changes. WPF stayed transport-only throughout.

## 5. Prof KP
Defined as **Weekly Quest + Treatise only**, enforced independently at three layers:
1. Persistence's `deriveState` (per-source COMPLETE/INCOMPLETE/UNKNOWN)
2. `ProfessionWeeklyStatusService`'s `accumulate()` routing (Knowledge Drops sources never added to the Prof KP aggregate)
3. Overview's `resolveProfessionWeeklyOverviewState` mapper (state derived only from `profKp`, never `drops`)

Each layer has its own "critical regression" unit test proving an INCOMPLETE Drops never changes a COMPLETE Prof KP.

**Live confirmation**: Synfel (Inscription Weekly Quest+Treatise both complete, Leatherworking Weekly Quest complete/Treatise incomplete) → Prof KP 3/4, exactly matching real in-game state you confirmed. Syndekaay's Blacksmithing Weekly Quest was independently observed transitioning INCOMPLETE → COMPLETE after you turned it in, correctly propagated end-to-end through addon → import → DB → status service.

## 6. Drops
Fully separate aggregate everywhere it appears (service, mapper, UI). Not captured by the addon in this slice — no verified persistent evidence source exists yet (bag-item possession was explicitly rejected as unreliable in the original audit). Infrastructure (`KNOWLEDGE_DROPS` sourceType, `externalCurrencyId` field, aggregate plumbing) is in place for future work; zero definitions are seeded so it currently always reads as "not tracked" everywhere.

## 7. UI
- **Character Detail**: new compact per-profession section (Weekly Quest/Treatise/Drops), reusing `StatusToken` and matching the sibling Resources section's minimal styling.
- **Weekly Checklist**: two new additive, read-only columns (Prof KP, Drops) next to the existing manual "Profession knowledge" task — the manual task is untouched.
- **Overview**: two new additive columns (Prof KP, Drops) placed next to — not replacing — the existing "Prof." column. That column tracks a different thing entirely (whether profession *data* is captured at all, not weekly completion); repurposing it per the task's literal wording would have silently conflated two unrelated domains, so it was left alone as a deliberate deviation from the literal instruction.

Not verified visually in a browser: the dev server requires real Battle.net OAuth sign-in, which I can't complete on your behalf, and this environment's Browser pane can't take screenshots. Verified instead via component tests that assert the actual rendered symbols/tones/labels, plus clean type-checking.

## 8. Live
- Diagnosed and explained a real gotcha: switching characters via character-select does **not** reload addon Lua code — only a genuine `/reload` or client restart does. This caused the first post-correction test to still show old quest IDs.
- After your full game restart and relogging through all 20 characters, all quest IDs matched the corrected catalog exactly.
- Replayed the live SavedVariables file directly through the real import pipeline (`scripts/import-addon-savedvariables.mjs`) to prove the full path end-to-end without requiring additional in-game actions: 80 snapshot rows created (20 characters × 4 enabled sources), idempotent on a second run.
- You confirmed Syndekaay's "both still open" state and independently turned in Blacksmithing's weekly quest mid-session — that exact transition was captured and correctly reflected.

## 9. Tests
`npm run verify`: **636/636 tests passing**, architecture check (922 source files), lint, build, and SavedVariables contract check all green.

New coverage added this slice: addon-import profession-weekly persistence (11 tests across 2 files), `ProfessionWeeklyStatusService` (5 tests incl. the phantom-profession regression), Overview mapper (5 tests), Character Detail section (2 tests), Weekly Checklist matrix (1 new test), Overview matrix (1 new test).

## 10. Scope
- M+ / Raid / Delves / Vault / Tier / Embellishments touched: **NO**
- C# gameplay logic added: **NO**
- `scripts/dev-manager.services.mjs` touched: **NO** (untouched throughout)

## Final Verdict: **PASS**

Weekly Quest + Treatise automatic tracking is live-verified and enabled for 8 of 11 professions, with a real bug found and fixed during acceptance. Herbalism/Mining/Skinning remain correctly disabled pending a character that actually has one of those professions. Knowledge Drops capture is out of scope for this slice (no viable evidence source found) but the read model is ready for it.

PR #6 stays in draft until Herbalism/Mining/Skinning get their own live evidence.

**Not starting Slice B.**
