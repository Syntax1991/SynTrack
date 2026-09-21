# SynTrack Product Roadmap

## Vision

SynTrack is a **personal World of Warcraft Warband Control Center** — not another statistics browser or AlterEgo clone.

Opening SynTrack should quickly answer:

1. What should I do next?
2. Which character should I do it on?
3. Which weekly tasks are still missing?
4. Which character can craft something?
5. Which professions / specializations are covered?
6. Which characters need setup, gear, resources, or attention?
7. Which information is reliable, stale, or unknown?

**Core value:** transform **data → decision**.

| Raw state | SynTrack action |
|-----------|-----------------|
| Synlight · Vault 8/9 | 1 World activity → Vault 9/9 |
| Synblast · Alchemy Drops 0/4 | 2 Alchemy Knowledge Drops remaining |
| 6 Blacksmiths | Who should craft this item? → Synvoid · Q5 · correct spec |

---

## Product pillars

### PLAN — What should I do this week?

Account-wide triage, weekly priorities, Vault / M+ / Raid / Delves, profession weeklies, resources, next useful objective, attention ordering.

### CRAFT — Which character can do this?

Profession coverage, specialization coverage, recipe knowledge, quality capability, Find Craft, crafter responsibilities, profession weeklies, permanent profession progression.

### CONTROL — What is the state of my whole account?

Roster, character lifecycle, tracking profiles, gear, resources, account sync, data freshness, season handling, character detail, UNKNOWN / stale / current state.

---

## Permanent principles

1. **UNKNOWN > WRONG**
2. Prefer automatic capture over manual tracking
3. WoW session data is a capture source — not the authoritative roster
4. Failed / missing capture must not delete characters
5. Gameplay and profession membership are independent
6. Weeklies = reset-aware work only; permanent progression lives elsewhere
7. Overview is triage — not a database dump
8. Character Detail is drilldown — may be richer
9. Prefer configurable definitions over season-specific permanent schema/enums
10. Do not recreate AlterEgo feature-by-feature

---

## Current baseline (do not rebuild unnecessarily)

**Roster:** Characters, tracking profiles, tags, gameplay/profession scopes

**Weekly gameplay:** Great Vault, M+, Raid, Delves, slot-level detail, `C_WeeklyRewards` authority

**Professions:** setup, weekly Quest/Treatise/Drops, Knowledge Treasures, specializations, recipes, Find Craft

**Gear:** equipped gear, ilvl, sockets, enchants

**Resources:** tracked seasonal resources

**Client:** Windows desktop, SavedVariables watcher, Battle.net / SynTrack account connection

**Web:** Overview, Characters, Weeklies, Professions, Gear, Settings

---

## Current gate — PR #22

**Feature:** safe character removal / restore  
**Status:** implementation complete; **live acceptance required before merge**

Must prove:

- Remove disposable character
- Normal sync → character stays suppressed
- Restore → normal sync → character returns exactly once, correct ownership

**Do not begin Phase 1 until PR #22 is accepted and merged.**

---

## Milestones (execution order)

Work **one milestone at a time**. After each: focused tests, `npm run verify`, visual/live acceptance where applicable, PR, **stop**. Next milestone starts only after the previous is merged.

| Phase | Name | User question solved |
|-------|------|----------------------|
| **1** | Trust the sync | Where did data come from? Is it fresh? |
| **2** | Overview becomes the product | What should I do next? |
| **2A** | Action priority engine | Canonical account-level priorities (backend, not ad-hoc React) |
| **2B** | Today / this week | Needs attention · Quick wins · This week · Ready |
| **3** | Character Detail control center | Who is this character? What's unfinished? What can they craft? |
| **4** | Reduce page duplication | Keep Gear as account-wide view or fold into Character Detail (decide on IA) |
| **5** | Craft network | Who can craft X best? Where are gaps and overlaps? |
| **5A** | Find Craft 2.0 | Ranked crafters with quality, spec, requirements — UNKNOWN when unproven |
| **5B** | Profession responsibility matrix | Intentional crafting network, not a profession list |
| **5C** | Coverage gaps | Missing specs, unknown recipes, duplicate capability (informational) |
| **6** | Account-wide weekly planner | Planning layer on Weeklies without becoming a todo app |
| **7** | Data freshness / trust | CURRENT · STALE · UNKNOWN · NOT APPLICABLE consistently |
| **8** | Gear readiness | Fix Unknown labels; surface actionable gear problems |
| **9** | Resources as decisions | "1 remaining" not just "4/5" |
| **10** | Season rollover | Config/data updates, not schema redesign |
| **11** | History | Useful insights only — maintenance patterns, not analytics dashboards |
| **12** | Smart notifications | After priority engine is reliable; actionable, time-sensitive, high confidence |
| **13** | Onboarding | Battle.net → client → addons → play → web; no SavedVariables literacy required |
| **14** | Product polish | Empty/loading/error states, terminology, navigation consistency |

### Phase 1 detail (next after PR #22)

Rebuild **Settings** around current architecture:

- **Account:** SynTrack account, BattleTag, connection state — no legacy "My Raider Login" / demo character
- **Battle.net:** linked account, roster discovery, reconnect
- **WoW / Sync:** desktop client state, watched install/account, last sync, addon data state; manual import = Advanced/fallback only

**Target:** *"SynTrack synced 2 minutes ago"* — not guessing if numbers are current.

### Phase 2 north star (Overview)

```
SYNTRACK · Warband Control Center · Reset in 1d 11h

4 things worth doing
  Synlight · VAULT · 1 World activity → Vault 9/9
  Syndraco · MYTHIC+ · 4 runs → M+ slot 3
  …

WARband · 22 Characters · [ All | Gameplay | Professions ]
  compact roster matrix…
```

Action layer **above** the dense matrix — do not remove the matrix.

---

## Success criteria

User opens SynTrack to **decide**, not merely inspect numbers.

With 15+ characters, several profession alts, active M+, weekly Vault goals:

| Time | Should answer |
|------|----------------|
| 10s | Highest-value next activity |
| 30s | Who can craft a specific item |
| 60s | Which characters need attention this week |

---

## Non-goals

Do **not** build inside this roadmap:

- Guild management, raid setup tooling, cooldown planners
- WoWAudit clone, recruitment platform
- Features copied from other addons without strengthening core proposition (teleport buttons, dungeon announcements, affix calendars, damage meters)

---

## Workstream strategy

- Broad workstreams only (`feature/webapp` for Settings, Overview, Weeklies, Character Detail, Professions, Gear)
- No micro-branches for small follow-ups
- Canonical folder: `D:\Projects\SynTrack`
- `npm run dev:stop` before branch switches
- Protected: `scripts/dev-manager.services.mjs` — never modify

---

## Implementation priority (summary)

1. **Finish PR #22** (character remove / sync / restore / sync)
2. Settings / sync trust
3. Overview action / priority engine
4. Character Detail control center
5. Craft network / Find Craft 2.0
6. Profession responsibility / coverage
7. Weekly planner improvements
8. Freshness / confidence UX
9. Gear readiness cleanup
10. Resource decision layer
11. Season rollover hardening
12. History → Smart notifications → Onboarding → Polish
