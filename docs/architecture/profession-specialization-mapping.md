# Profession Specialization Capability Mapping

## The problem this solves

SynTrack wants to answer "which character is responsible for what" for
every crafting profession's specialization tree - e.g. "Synbeam is
specialized in Shields" or (eventually) "Synspin is specialized in 2H
Swords." Blizzard's client API gives us the exact IDs for specialization
nodes and the exact IDs for recipes/items, but it does **not** expose any
machine-readable link between the two: no API call returns "which recipes
does node X boost." The only place that relationship appears at all is
the node's own human-readable tooltip text (a `$ev1`/`$en1` template
resolved by the game client), which the server-side spell logic consumes
but never exposes as data.

This is a real limitation of the WoW addon API, not a gap in this
codebase - see the Phase A audit that discovered it for the full trace of
every `C_TradeSkillUI`/`C_Traits`/`C_ProfSpecs` call this addon makes.

## Two evidence layers

Because of that limitation, SynTrack draws on two genuinely different
kinds of evidence, and keeps them labeled so neither is ever confused for
the other:

- **MACHINE_VERIFIED** - a fact derived entirely from stable Blizzard IDs
  the addon captures automatically, with no human judgment involved.
  Example: `EQUIPMENT_FAMILY`/`WEAPON_TYPE`/`EQUIPMENT_SLOT` recipe
  capabilities, derived from `outputItemArmorSubclassKey` /
  `outputItemWeaponSubclassKey` / `outputItemEquipLoc` - real Blizzard
  item-data enums, reversed at runtime, never guessed.
- **CURATED_VERIFIED** - an assertion a human made once, by reading a
  specific node's real Blizzard-authored description text (or the live
  WoW specialization UI, or a project-owner screenshot) and hand-keying
  the result against that node's *stable Blizzard ID*. Once authored,
  production code resolves it by ID lookup only - nothing parses a node's
  name or description at runtime to decide a claim.

CURATED_VERIFIED is emphatically **not** the same thing as inference. An
inferred/derived value would re-run some text-matching heuristic every
time the data is read, and could silently misfire the moment Blizzard
reworded a tooltip or the client language changed. A curated mapping is
authored once, keyed by an ID that never changes meaning, and stays
correct until Blizzard actually renumbers the node (which the "unmapped"
report below would immediately surface, since the old ID would just stop
appearing in current data). It's the same pattern as maintaining an
enum/catalog mapping from an external system whose semantic relationship
isn't exposed programmatically - a common, unremarkable thing to do, not
a workaround.

## The capability model

```ts
type SpecializationCapabilityKind =
  | "EQUIPMENT_SLOT"     // armor pieces, weapon handedness, jewelry slots,
                         // profession tool/accessory slots
  | "WEAPON_TYPE"        // a proven Enum.ItemWeaponSubclass-backed weapon
                         // type (Axe/Mace/Polearm/...)
  | "PROFESSION_GEAR"    // a specific profession's tool/accessory - reserved
  | "CRAFT_CATEGORY"     // a verified specialization node proven to belong
                         // to a presentation category (e.g. "Weapons") whose
                         // EXACT sub-identity (which weapon subclass) is not
                         // provable - see Blacksmithing's Long Blades/Short
                         // Blades below
  | "GENERAL";           // tree-root/general bonus - reserved

type SpecializationClaimProvenance = "CURATED_VERIFIED";

type SpecializationEquipmentSlotClaim = {
  provenance: SpecializationClaimProvenance;
  kind: SpecializationCapabilityKind;
  capabilityKey: string;        // stable identity, see below
  presentationGroup: string;    // display-only grouping, see below
  familyKey: "LEATHER" | "MAIL" | "PLATE" | "CLOTH" | null;
  familyName: string;
  slotKey: string;
  slotName: string;
  isBundle: boolean;
};
```

`EQUIPMENT_SLOT`, `WEAPON_TYPE`, and `CRAFT_CATEGORY` are populated today
(all three currently only by Blacksmithing). `PROFESSION_GEAR`/`GENERAL`
exist so a future curated mapping has a real kind to declare, but nothing
creates them yet - this project avoids speculative architecture; a kind
gets used only once real curated data needs it.

`CRAFT_CATEGORY` exists specifically for the case a plain "leave it
UNKNOWN" would under-serve: a specialization node whose TREE POSITION and
own text prove it belongs to a category (e.g. it's a real, captured
direct child of the Weaponsmithing root, the same position as nodes
already mapped to real weapon types) but whose EXACT sub-identity isn't
provable from Blizzard's own vocabulary. Blacksmithing's "Long Blades"/
"Short Blades" nodes are curated this way: `slotName` is the node's own
real captured name ("Long Blades"), shown as a neutral passthrough label
rather than a translated weapon type - this is not "inferring a
capability from a name" (the node's OWN identity is simply being
displayed, not interpreted into a different claim), it's the same
principle that already lets `nodeName` appear next to every rank
("Wonderful Wristguards 20/20") elsewhere in this codebase. A character's
real, verified investment must never disappear from the UI just because
its exact weapon subclass can't yet be proven - see the CRAFT_CATEGORY
"most specific wins" acceptance case for Synspin (Long Blades 7/25 +
Short Blades 25/25, both shown; the "Blades" bundle correctly suppressed)
in profession-specialization-equipment.mapper.blacksmithing.weapons.test.ts.

### capabilityKey - why family+slot stopped being enough

The original architecture keyed a claim implicitly by `${familyName}:
${slotKey}` (e.g. "Leather:WRIST"). That's fine as long as at most one
curated node ever legitimately claims a given family+slot pair - true for
every armor/cloth/jewelry tree mapped so far. It breaks down for trees
like Inscription's Blueprints (three different nodes - "Chef's Rolling
Pin," "Alchemist's Mixing Rod," "Scribe's Quill" - all genuinely claim
the same `PROFESSION_TOOL` slot, for three different target professions)
or Engineering's Market Mobility (four nodes, same collision). Those
nodes are still unmapped (see the backlog below) precisely because there
is no ID bridge to tell them apart automatically - but the **data model**
now has room for the eventual curated answer: each would get its own
explicit `capabilityKey` (e.g. `"inscription.profession_gear.scribe_tool"`
vs `"inscription.profession_gear.cooking_tool"`), both legitimately
carrying `slotKey: "PROFESSION_TOOL"`, and both would show up as two
separate rows rather than one silently overwriting the other.

`slotClaim()` defaults `capabilityKey` to `${familyName}:${slotKey}` when
no explicit key is given, so every existing curated entry (all ~50 calls
across the 7 mapped professions) needed zero changes - the generalization
is purely additive. A curator only passes an explicit `capabilityKey` (and
`kind`) once a real node actually needs to coexist with another node on
the same generic slot.

### presentationGroup - domain truth vs. display grouping

`presentationGroup` is a second, independent, purely cosmetic field.
Blacksmithing's `Shields` node is genuinely a different family
(`Shield`) from `Plate` internally - nothing merges them, no
`CraftCapability` conflates them, `familyName`/`familyKey` stay exactly
as they were. But both claims set `presentationGroup: "Armor"`, so the
Specializations view renders them under one shared "Armor" heading
instead of two single-item sections. This is authored explicitly per
claim by whoever curated it (see
`profession-specialization-equipment.blacksmithing.definitions.ts`), not
inferred from any name at runtime, and it defaults to `familyName` (i.e.
"no extra grouping") for every profession that hasn't opted in.

## Why nodeId is the right identifier

The addon captures four IDs for a specialization entry: `nodeId`,
`entryId`, `definitionId`, `spellId` (`SpecializationEntries.lua`,
`SpecializationTraits.lua`). Only `nodeId` (stored as the
`ProfessionSpecializationNode.key`, formatted `addon:<nodeId>`) and
`spellId` are persisted to Prisma today - `entryId`/`definitionId` are
captured but discarded before they reach the database.

`nodeId` is the correct identifier to curate against:

- It's already the unique key every mapper in this codebase resolves
  against - no new lookup path needed.
- Every specialization node captured so far is a simple rank/tier node
  with exactly one entry (`Enum.TraitNodeType.Single` or `Tiered`) - none
  exhibit real `Selection`-type "pick one of several entries" behavior,
  which is the only case where `entryId` would matter as a *separate*
  identity from `nodeId`.
- If a future profession's tree does turn out to have real multi-entry
  Selection nodes, the fix is additive: compose the key as
  `addon:<nodeId>:<entryId>` and persist `entryId` alongside `spellId`.
  Don't build that support speculatively before a real tree needs it.

`spellId` is retained as a secondary, human-verification-only aid (it's
what lets a curator cross-reference Wowhead/the live tooltip while
authoring a mapping) - it is never used by production resolution logic.

## How to add a new curated mapping

1. Run `npm run audit:unmapped-specialization-nodes` against the real
   dev database. It lists every MIDNIGHT specialization node per
   profession, marks it MAPPED/UNMAPPED, and - for unmapped nodes - shows
   every real character currently invested in it with their rank.
2. Pick an unmapped node. Check its real Blizzard-authored `name`/
   `description` (already captured in `ProfessionSpecializationNode`) and,
   if the text alone isn't conclusive, the live WoW specialization UI or
   a screenshot from the project owner.
3. Determine the exact capability it grants - a slot (for
   `EQUIPMENT_SLOT`), or (once needed) a specific profession-gear target
   or craft category.
4. Add one entry to that profession's
   `profession-specialization-equipment.<profession>.definitions.ts`
   file, keyed by the node's exact `addon:<nodeId>` key, using `slotClaim()`.
   Only pass an explicit `capabilityKey`/`kind` when the claim needs to
   coexist with another node on the same generic slot; otherwise the
   default is correct.
5. Add a focused test: exact ID resolves, a wrong/different ID does not,
   rank/maxRank is preserved.
6. Re-run the audit script - the node should now show `[MAPPED]`.

Never derive a mapping from matching a node's name/description against
another string at runtime - that remains prohibited (see "Two evidence
layers" above). Curation happens once, by a human, at authoring time.

## Weapon subclass capture (recipe side only)

`RecipeCatalogEntry.lua` already read every recipe's output item's
`itemClassId`/`itemSubclassId` (for `resolveArmorSubclassKey`), but only
resolved a friendly key for armor. `resolveWeaponSubclassKey` mirrors that
exact pattern for `Enum.ItemWeaponSubclass`, additively: it's a pure
reversal of the live client's own enum table, never a hardcoded numeric
constant, and degrades to `nil` (never a guess) if the enum is
unavailable. The resolved key (e.g. `"Sword2H"`) is normalized server-side
(`addon-import.recipe-output-capability.ts`,
`resolveRecipeWeaponTypeFromWeaponSubclassKey`) to a weapon TYPE
("Sword") - handedness is deliberately dropped here, since it already
comes from the existing `outputItemEquipLoc`-derived `EQUIPMENT_SLOT`
capability (`ONE_HAND`/`TWO_HAND`/...). A "2H Sword" craftable-equipment
row is the same `WEAPON_TYPE` + `EQUIPMENT_SLOT` pairing
(`profession-equipment-coverage.mapper.ts`) that armor already uses for
"Leather Wrist" - both require both capabilities to originate from the
*same* learned recipe, so a reader can never combine "has a Sword recipe"
with "has a Two-Hand recipe" from two different recipes into an unearned
claim.

This is a **recipe/craftable-equipment** fact (Find Craft Browse can now
group "Blacksmithing -> Weapons -> Sword -> Two-Hand") independent of
specialization *responsibility*. But it turned out to partially unlock
responsibility too, for a specific reason: some Weaponsmithing node
descriptions use Blizzard's own standard weapon-subclass words verbatim
("axes and polearms," "maces") - the exact same vocabulary
`resolveRecipeWeaponTypeFromWeaponSubclassKey` already normalizes real
recipes to ("Axe," "Polearm," "Mace") - so curating e.g. addon:104627
("Axes and Polearms") -> WEAPON_TYPE Axe + Polearm carries the same
confidence as "Helms" -> Head: a node's own text names a word that IS
Blizzard's own enum vocabulary, not an idiosyncratic label. Other nodes in
the same tree ("Long Blades," "Short Blades") do NOT use that vocabulary -
"long blade" isn't an `Enum.ItemWeaponSubclass` term the way "axe" is -
so whether it means Sword2H, Sword1H+Sword2H, or something else cannot be
determined from the text alone, and those stay UNKNOWN pending live-UI or
screenshot verification. See
profession-specialization-equipment.blacksmithing.definitions.ts for the
exact node-by-node reasoning.

## Current mapping status

Run `npm run audit:unmapped-specialization-nodes` for the live, current
answer - the counts below will drift as curation continues and should not
be treated as a snapshot of truth. As of this writing:

| Profession      | Mapped nodes | Unmapped nodes |
|-----------------|-------------:|----------------:|
| Leatherworking  | 20           | 12 (general/root only) |
| Blacksmithing   | 20           | 20 (Craftsmithing's Tool Stones, Weaponstones, The Old Ways, general/root) |
| Tailoring       | 12           | 14 (general/root only) |
| Jewelcrafting   | 2            | 33 (gems, reagents, profession gear, general/root) |
| Inscription     | 4            | 31 (profession-tool trio, Darkmoon tree, reagents, general/root) |
| Engineering     | 4            | 17 (Market Mobility, Recycling/Bits and Bots, general/root) |
| Enchanting      | 3            | 24 (Elevating Equipment, general/root) |
| Alchemy         | 0            | 22 (entirely RECIPE_GROUP-only, no ID bridge found) |

Every "unmapped" node either (a) has no ID-backed capability to attach to
at all (RECIPE_GROUP-only trees - potions, flasks, gems, glyphs,
reagents, illusions), or (b) collides with sibling nodes on one generic
slot with no ID to tell them apart (the profession-gear/Darkmoon cases).
Neither is a task left undone - both are the actual ceiling of what
Blizzard's client API exposes today, confirmed by the Phase A audit, not
an oversight in this mapping layer.
