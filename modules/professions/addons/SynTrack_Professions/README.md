# SynTrack WoW Addon

This directory contains the in-game data collector for SynTrack.

## Version 0.4.0

Version 0.4.0 separates static profession specialization definitions from character-specific progress.

Previous versions stored the complete specialization tree below every character and expansion.

The same static tree would therefore be duplicated for every profession character.

## SavedVariables architecture

Static profession data is stored once per expansion skill line.

    ProfessionTrackerDB
      professionCatalog
        2906
          Midnight Alchemy
          tabs
          nodes
          entries
          descriptions
          icons

Character-specific data contains only the actual progress.

    ProfessionTrackerDB
      characters
        eu:antonidas:synmist
          professions
            Alchemy
              expansions
                2906
                  knowledge
                  tabStates
                  nodeRanks

A node that has no invested ranks does not need an entry in nodeRanks.

## Multi-expansion support

Expansion snapshots remain keyed by their expansion skill-line IDs.

Example:

    Alchemy
      expansions
        2906
          Midnight Alchemy
        2871
          Khaz Algar Alchemy

Midnight and The War Within profession progress can therefore coexist.

## Automatic migration

Version 0.3 expansion snapshots stored their complete tree in the character object.

When version 0.4 refreshes that character:

    1. The static specialization tree is copied to professionCatalog.
    2. The character snapshot is converted to compact tabStates.
    3. Only non-zero node progress is retained in nodeRanks.
    4. Knowledge and expansion metadata remain on the character.

No SavedVariables reset is required.

## Architecture

Core.lua

Shared constants, helper functions and database initialization.

SpecializationEntries.lua

Reads specialization trait entry definitions.

SpecializationTraits.lua

Reads specialization trait nodes, ranks and currencies.

SpecializationTabs.lua

Reads specialization tabs and root paths.

Specializations.lua

Collects the currently selected profession expansion.

SpecializationCatalog.lua

Builds and stores the shared static profession tree catalog.

SpecializationProgress.lua

Builds compact character progress and migrates version 0.3 snapshots.

Professions.lua

Collects primary professions and keeps expansion-specific progress.

Character.lua

Builds and persists character snapshots.

Events.lua

Handles profession events and slash commands.

## Capturing profession data

Open the desired profession and expansion and run:

    /pt sync

Repeat that for every relevant profession and expansion.

Afterward run:

    /reload

## Commands

    /pt
    /pt status
    /pt sync

## SavedVariables

WoW names the SavedVariables file after the addon folder, not after the
`## SavedVariables:` table declared in the .toc. The addon folder is
`SynTrack_Professions`, so the file WoW writes is:

    WTF\Account\<Account>\SavedVariables\SynTrack_Professions.lua

Its top-level Lua table is still named `ProfessionTrackerDB` on purpose,
to preserve existing user data across the addon rename. The legacy
`ProfessionTracker` compatibility shim (see its own README) writes the
same `ProfessionTrackerDB` table under `ProfessionTracker.lua` for as
long as that addon stays enabled.

## Development installation

Copy the SynTrack_Professions directory into:

    World of Warcraft\_retail_\Interface\AddOns\

The manifest must be located at:

    World of Warcraft\_retail_\Interface\AddOns\SynTrack_Professions\SynTrack_Professions.toc