# My SynTrack

Personal workspace and projections for the logged-in player.

## Capabilities

- My Characters
- Character Detail control hub
- Weekly Checklist
- Vault / M+
- Raid Tasks
- Gear / Enchants / Gems
- personal profession status

## Current source

- API: `modules/my-syntrack/api`
- Web: `modules/my-syntrack/web`

## Implemented workspaces

- personal dashboard and character overview
- character roster management
- one-request Character Detail aggregation with stable-ID deep links into
  Weeklies, Vault/M+, Professions and Gear
- reset-aware weekly checklist with per-character progress
- Mythic+ run log and derived Great Vault dungeon slots
- personal raid preparation tasks with priorities and deadlines
- equipment readiness with item levels, enchants and socket coverage

My SynTrack may compose data from other modules, but does not duplicate
their business rules.
