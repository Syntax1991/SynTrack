# SynTrack Main Modules

## Purpose

SynTrack is a platform, not a single profession tracker.

Every major feature must belong to one explicit main module. Main
modules define business ownership and prevent unrelated features from
growing into one large coupled application.

## Module map

```text
SynTrack
|
+-- My SynTrack
|   +-- My Characters
|   +-- Weekly Checklist
|   +-- Vault / M+
|   +-- Raid Tasks
|   +-- Gear / Enchants / Gems
|   +-- Professions
|
+-- Guild
|   +-- Dashboard
|   +-- Roster
|   +-- Teams
|   +-- Attendance
|   +-- Weekly Progress
|   +-- Requirements
|   +-- Officer Notes
|
+-- Loot
|   +-- Wishlist
|   +-- Droptimizer
|   +-- Loot Council
|   +-- Loot History
|   +-- Tier / Token Planning
|   +-- Split Planning
|
+-- Professions
|   +-- Crafter Finder
|   +-- Recipes
|   +-- Knowledge
|   +-- Specializations
|   +-- Material Quality
|   +-- Concentration
|   +-- Craft Recommendations
|
+-- Recruitment
|   +-- Applications
|   +-- Raider.io
|   +-- Warcraft Logs
|   +-- Availability
|   +-- Trial Tracking
|   +-- Recruitment Board
|
+-- Automation
|   +-- Discord Bot
|   +-- Reminders
|   +-- Missing Weeklies
|   +-- Officer Alerts
|
+-- Data Platform
    +-- Battle.net
    +-- Raider.io
    +-- Warcraft Logs
    +-- SynTrack Addon
    +-- SynTrack Companion
```

## 1. My SynTrack

### Responsibility

Personal workspace for the logged-in player.

It aggregates user-specific information from other modules without
owning their underlying business rules.

### Examples

- personal characters
- weekly checklist
- Great Vault and Mythic+ progress
- personal raid tasks
- missing enchants and gems
- personal profession status

### Dependency rule

My SynTrack may read projections from Guild, Loot and Professions.

It must not implement duplicate profession or loot logic.

## 2. Guild

### Responsibility

Guild organization and persistent guild state.

### Owns

- guild roster
- guild leadership verification
- gear audit (live item level / enchant / socket compliance)
- teams
- weekly guild progress
- guild requirements
- officer notes

### Does not own

- loot decisions
- recruitment application lifecycle
- the Battle.net OAuth connection itself (Data Platform owns that;
  Guild only consumes it to verify leadership)

### Existing implementation

Guild is fully implemented — all seven planned capabilities exist,
plus a Gear Audit added afterward.

Web:

- `modules/guild/web/dashboard`
- `modules/guild/web/roster`
- `modules/guild/web/audit`
- `modules/guild/web/verification`
- `modules/guild/web/teams`
- `modules/guild/web/requirements`
- `modules/guild/web/officer-notes`
- `modules/guild/web/weekly-progress`

API:

- `modules/guild/api/roster`
- `modules/guild/api/roster-import`
- `modules/guild/api/verification`
- `modules/guild/api/audit`
- `modules/guild/api/teams`
- `modules/guild/api/requirements`
- `modules/guild/api/officer-notes`
- `modules/guild/api/weekly-progress`

Module-owned addon:

- `modules/guild/addons/SynTrack_Guild`

Guild members can be managed manually through the Roster API or
synced from the `SynTrack_Guild` WoW addon, but only once the guild's
leadership has been verified through Blizzard's official Battle.net
APIs (see `modules/guild/api/verification`). Verification reuses Data
Platform's existing Battle.net client and connection rather than
duplicating OAuth handling — this is Guild consuming a Data Platform
contract, not Data Platform making a business decision. The addon
keeps its own `SynTrack_GuildDB` SavedVariables and registers with
`SynTrack_Core` only for status visibility; roster data is
transported through the dedicated roster-import endpoints, reusing
Data Platform's generic Lua SavedVariables parser.

Teams group existing roster members into persistent units (e.g. a
Mythic core team) independent of any specific raid event; they only
reference `GuildMember` by ID. The Gear Audit pulls every roster
member's live equipped gear straight from Blizzard (average item
level, missing enchants on commonly-enchantable slots, socket fill)
via the verified officer's Battle.net connection — unlike Weekly
Progress it does not require a matching My SynTrack `Character`,
since it works off the roster's own name/realm directly (resolving
the realm slug with a lowercase/hyphenate heuristic, since
`GuildMember` only stores the realm display name). Requirements are a
documented list of expectations (gear, keystone, attendance, ...); a
`GEAR` requirement may set a minimum item level, in which case it is
checked live against the Gear Audit data — other categories remain
plain documentation. Officer Notes are freeform per-member
commentary, stamped server-side with the verified officer's character
name — never taken from client input. Weekly Progress is a read-only
cross-reference against My SynTrack's `Character` /
`WeeklyChecklistCompletion` / `WeeklyMythicPlusRun` data, matched by
exact name/realm/region identity — an identity match, not a deeper
integration. Requirements, Officer Notes and the Gear Audit refresh
all go through the same verification gate as the roster; Weekly
Progress and the Dashboard are read-only and stay open. (Attendance
was tracked by the Raid module's own event/per-member records, not a
separate Guild-owned feature — see the removal note below.)

> The Raid main module (Raid Planner, Boss Rosters, Setups,
> Attendance, Signups, Cooldown Planning) existed from 2026-08-14
> through 2026-08-25, when the product direction changed to a
> personal multi-character tracking focus and the entire Raid
> product segment was removed. See git history for its prior
> implementation.

## 3. Loot

### Responsibility

Loot planning and distribution.

### Owns

- wishlists
- Droptimizer data
- loot council decisions
- loot history
- tier and token planning
- split planning

### Dependency rule

Loot references Guild members through stable identifiers or
contracts.

## 4. Professions

### Responsibility

All crafting and profession intelligence.

### Owns

- crafter finder
- recipes
- profession knowledge
- specialization trees
- material quality
- concentration
- crafting operations
- minimum sufficient material recommendations
- craft recommendations

### Existing implementation

The current profession implementation is physically grouped beneath
the Professions main module.

Web:

- `modules/professions/web`
- `modules/professions/web/details`
- `modules/professions/web/specializations`

API:

- `modules/professions/api`
- `modules/professions/api/details`
- `modules/professions/api/specializations`

Module-owned addon:

- `modules/professions/addons/SynTrack_Professions`
- `modules/professions/addons/ProfessionTracker` (compatibility shim,
  carries the historical `ProfessionTrackerDB` SavedVariables forward
  during the migration window)

The SavedVariables database name remains unchanged to preserve
existing WoW user data.

## 5. Recruitment

### Responsibility

Applicant and trial lifecycle.

### Owns

- applications
- Raider.io applicant information
- Warcraft Logs applicant information
- availability
- trial tracking
- recruitment board

### Dependency rule

Accepted recruits may transition into Guild membership through an
explicit application service.

## 6. Automation

### Responsibility

Cross-module triggers and notifications.

### Owns

- Discord bot workflows
- reminders
- missing weekly alerts
- officer alerts

### Dependency rule

Automation consumes events and read models from other modules.

Automation must not become the owner of the business state that caused
an alert.

## 7. Data Platform

### Responsibility

External integrations, ingestion, synchronization and transport.

### Owns

- Battle.net integration
- Raider.io integration
- Warcraft Logs integration
- SynTrack Addon ingestion
- SynTrack Companion synchronization
- import validation
- external identity mapping
- synchronization metadata

### Existing implementation

Web:

- `modules/data-platform/web/integrations`

API:

- `modules/data-platform/api/integrations`

Addon:

- `modules/data-platform/addons/SynTrack_Core`

Data Platform no longer has its own top-level sidebar nav module or
standalone routes (2026-08-14) — its two built web capabilities (WoW
Addon Sync, Battle.net character sync) are composed into Guild's
Settings pages instead (`/settings` and `/guild/settings`
respectively), following dependency principle 3 below ("frontend
pages may compose read models from multiple modules"). Business
ownership is unchanged: the underlying hooks/API calls/components
still live under `modules/data-platform/web/integrations`, just
without their own page/route/nav entry. See
`modules/data-platform/README.md`'s "No standalone nav presence"
section for the full reasoning.

### Dependency rule

Data Platform gathers and normalizes data.

Business interpretation belongs to the consuming domain.

For example:

- Data Platform imports crafting data.
- Professions determines craft recommendations.
- Data Platform imports Raider.io.
- Recruitment evaluates applicant context.

## Current My SynTrack implementation

Personal character and weekly-readiness features are grouped beneath
My SynTrack.

Web:

- `modules/my-syntrack/web/characters`
- `modules/my-syntrack/web/dashboard`
- `modules/my-syntrack/web/weekly-checklist`
- `modules/my-syntrack/web/vault-mythic-plus`
- `modules/my-syntrack/web/raid-tasks`
- `modules/my-syntrack/web/gear-readiness`

API:

- `modules/my-syntrack/api/characters`
- `modules/my-syntrack/api/dashboard`
- `modules/my-syntrack/api/weekly-checklist`
- `modules/my-syntrack/api/vault-mythic-plus`
- `modules/my-syntrack/api/raid-tasks`
- `modules/my-syntrack/api/gear-readiness`

## Web structure

Module-owned frontend code lives with its domain. The web app contains
only application composition and genuinely shared UI.

```text
apps/web/src
|
+-- app
|   +-- modules
|   +-- routing
+-- shared
+-- styles

modules/<main-module>/web
|
+-- pages
+-- components
+-- hooks
+-- api
+-- types
```

Planned modules receive a `web` directory only with their first real
frontend capability.

## API structure

Module-owned backend code lives with its domain. The API app contains
server startup, route composition, Prisma and shared infrastructure.

```text
apps/api/src
|
+-- server.ts
+-- app.ts
+-- routes
+-- infrastructure
+-- shared

modules/<main-module>/api
|
+-- controllers
+-- services
+-- repositories
+-- routes
```

Feature-level Route -> Controller -> Service -> Repository boundaries
remain inside the owning main module.

## Repository layout

Main modules own business code. Apps are thin deployable runtimes that
compose those modules.

Every module has a permanent addon boundary. API and web directories
are capability-driven and appear when the module implements them.

```text
SynTrack
|
+-- modules
|   +-- <main-module>
|       +-- README.md
|       +-- addons
|       |   +-- README.md
|       |   +-- <AddonName>        (when implemented)
|       +-- api                    (when implemented)
|       +-- web                    (when implemented)
|
+-- apps
|   +-- api
|   +-- web
+-- docs
+-- scripts
```

The root `modules` directory is the single source location for all
domain-specific API, web and addon code. `apps` contains only runtime
composition and shared application infrastructure.

### Why the Web app remains under `apps`

`modules` and `apps` answer different ownership questions:

- `modules/<main-module>` owns a business domain and all of its API,
  web and WoW-addon capabilities.
- `apps/web` is the executable browser application. It bootstraps React,
  supplies the shared layout and routing, and composes module pages.
- `apps/api` is the executable server. It starts the process, supplies
  shared infrastructure and mounts module routes.

The Web app is therefore not a ninth business module. Moving it to
`modules/webapp` would create a technical catch-all that owns parts of
every domain and would weaken the module boundaries. The same rule
applies to future executable products such as a Companion or Discord
bot: their runtime shell may live under `apps`, while their business
workflows remain in the owning main module.

If several independently deployable services or shared packages are
introduced later, shared technical packages may be added without
changing the domain ownership model:

```text
SynTrack
|
+-- packages
|   +-- contracts
|   +-- shared
|   +-- wow-data
+-- docs
+-- scripts
```

The project remains one Git repository unless release cadence, access
control or team ownership later requires a split.

## Migration sequence

### Phase 18A - Main-module foundation

- establish module registry
- document module ownership
- group website navigation by module
- align project metadata with SynTrack branding

### Phase 18B - Frontend domain migration

Completed for currently implemented capabilities:

- `my-syntrack`
- `professions`
- `data-platform`

### Phase 18C - Backend domain migration

Completed for currently implemented capabilities beneath the same
three owning modules.

Preserve Route -> Controller -> Service -> Repository -> Prisma.

### Phase 18D - Module-first monorepo

Completed for current production code:

- move application shells to `apps/api` and `apps/web`
- colocate API, web and addon source under each owning module
- retain one repository and one root verification workflow

### Phase 18E - New capabilities

The root manifests establish Guild, Loot, Recruitment and Automation.
API and web directories are created only with the first real
capability.

Do not create large empty module trees.

### Later - Additional applications and packages

Add the Companion or reusable technical packages beneath `apps` and
`packages` while module business logic remains beneath `modules`.

## Dependency principles

1. A business rule has exactly one owning main module.
2. Modules communicate through explicit contracts or application
   services.
3. Frontend pages may compose read models from multiple modules.
4. Data Platform normalizes external data but does not own domain
   decisions.
5. Automation reacts to domain events but does not own source state.
6. My SynTrack aggregates personal state but does not duplicate
   business rules.
7. Shared code must remain genuinely domain-neutral.
8. New features must declare their owning main module before
   implementation.
9. Cross-module database relations use stable identifiers.
10. Circular module dependencies are not allowed.

## WoW addons and Companion

SynTrack supports multiple module-owned WoW addons. Their source lives
under `modules/<main-module>/addons/<technical-name>`.

Every main module contains an `addons` directory even before its first
addon exists. The directory itself is only the module boundary; each
real addon must be placed in a separate technical-name subdirectory so
several addons can coexist without mixing source files.

The profession and guild addons therefore live under Professions and
Guild respectively. Future personal-tracking or loot addons can live
under their own main modules without growing one global addon
directory.

`SynTrack_Core` is the shared Data Platform runtime used for stable
identity, module registration, events and SavedVariables transport. It
contains no profession, guild or loot business rules.

Data Platform owns the shared import, validation, identity and
synchronization contracts. Addons and the future SynTrack Companion use
those contracts but do not transfer their business ownership to Data
Platform.
