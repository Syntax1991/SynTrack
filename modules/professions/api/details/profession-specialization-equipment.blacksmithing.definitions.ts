import { slotClaim } from "./profession-specialization-equipment.types.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

const ARMOR_GROUP = { presentationGroup: "Armor" };
const WEAPONS_GROUP = { presentationGroup: "Weapons" };
const PROFESSION_GEAR_GROUP = {
  presentationGroup: "Profession Gear"
};

function weaponTypeClaim(
  capabilityKey: string,
  weaponTypeKey: string,
  weaponTypeName: string,
  isBundle: boolean
): SpecializationEquipmentSlotClaim {
  return slotClaim(
    null,
    "Weapon",
    weaponTypeKey,
    weaponTypeName,
    isBundle,
    {
      capabilityKey,
      kind: "WEAPON_TYPE",
      ...WEAPONS_GROUP
    }
  );
}

/*
 * For a verified specialization node that is proven to belong to the
 * Weapons category (it is a real, captured direct child of the
 * Weaponsmithing root, alongside the WEAPON_TYPE-mapped nodes above) but
 * whose EXACT weapon subclass cannot be proven from Blizzard's own
 * vocabulary, kind is CRAFT_CATEGORY rather than WEAPON_TYPE - the
 * category (the node itself) is verified, the specific weapon type is
 * not. slotKey/slotName intentionally reuse the node's own real name
 * verbatim as a NEUTRAL PASSTHROUGH LABEL, not a semantic translation:
 * this is not "inferring a capability from a name" (which stays
 * prohibited), it is displaying the actual identity of the thing the
 * character is proven to have invested in. Hiding a verified investment
 * because its exact weapon-subclass mapping is unproven would violate
 * the "UNKNOWN must not mean hide known specialization data" rule just
 * as much as a false claim would violate "no overclaiming."
 */
function weaponCategoryClaim(
  capabilityKey: string,
  categoryKey: string,
  categoryName: string,
  isBundle: boolean
): SpecializationEquipmentSlotClaim {
  return slotClaim(
    null,
    "Weapon",
    categoryKey,
    categoryName,
    isBundle,
    {
      capabilityKey,
      kind: "CRAFT_CATEGORY",
      ...WEAPONS_GROUP
    }
  );
}

/*
 * Blacksmithing - Armorsmithing tree only (addon:104576 root). Every claim
 * below was verified against this profession's own real, Blizzard-authored
 * node description text (captured in
 * ProfessionSpecializationNode.description), the same way the
 * Leatherworking table was built: e.g. node addon:104567 ("Articulating
 * Armor") reads "Gain +$ev1 $en1 to crafting waist, wrist, and hand
 * armor..." - Blizzard's own text naming the exact armor-piece words that
 * correspond 1:1 to the WAIST/WRIST/HANDS slot enum (resolveRecipeOutputSlot,
 * addon-import.recipe-output-capability.ts), not a fuzzy guess from the
 * node's own name.
 *
 * Plate and Shield are, and remain, genuinely different families
 * internally (familyKey/familyName are never merged - a Shield claim never
 * becomes a Plate claim). presentationGroup: "Armor" on every claim below
 * is purely a display-grouping hint a curator assigns explicitly - Shield
 * is conceptually part of a Blacksmith's defensive-gear output alongside
 * Plate armor, so both render under one "Armor" section instead of two
 * separate single-item sections. No mapper or frontend component infers
 * this from a name or profession key; it's just a field on the claim.
 *
 * Blacksmithing's other tree, Weaponsmithing (addon:104633 root), is now
 * PARTIALLY curated, following the weapon-subclass capture added after
 * the armor-only mapping above:
 *
 *   - addon:104627 ("Axes and Polearms"): "Master the art of crafting
 *     axes and polearms" -> WEAPON_TYPE Axe + WEAPON_TYPE Polearm. Both
 *     words are Blizzard's own standard weapon-subclass vocabulary
 *     (Enum.ItemWeaponSubclass Axe1H/Axe2H/Polearm, normalized to "Axe"/
 *     "Polearm" by resolveRecipeWeaponTypeFromWeaponSubclassKey - the
 *     SAME capability values real Blacksmithing weapon recipes already
 *     carry), not an idiosyncratic label needing interpretation - the
 *     same confidence tier as "Helms" -> Head.
 *   - addon:104628 ("Maces"): "Master the art of crafting maces" ->
 *     WEAPON_TYPE Mace.
 *   - addon:104629 ("Hafted Weapons"): "crafting hafted weapons such as
 *     maces, axes, and polearms" -> bundle of Axe + Mace + Polearm (same
 *     specific-vs-bundle preference as the armor claims above - a
 *     character invested in both "Axes and Polearms" and "Hafted
 *     Weapons" shows the more specific node for Axe/Polearm).
 *
 * addon:104630 ("Long Blades") and addon:104631 ("Short Blades") are
 * verified, real, direct children of the Weaponsmithing root (confirmed
 * via ProfessionSpecializationNode.parentNodeId against the live dev DB,
 * the same tree position as the WEAPON_TYPE nodes above) - the WEAPONS
 * category is proven. Their exact weapon subclass is NOT: "long blade"/
 * "short blade" are not Enum.ItemWeaponSubclass terms the way "axe"/
 * "polearm"/"mace" are, so whether "Long Blades" means Sword2H only, both
 * Sword1H+Sword2H, or something else cannot be determined from the
 * node's own text, and no live WoW UI or project-owner screenshot has
 * verified it yet. Curated as kind: CRAFT_CATEGORY (see
 * weaponCategoryClaim above) rather than left off the table entirely - a
 * verified investment must still be visible, just without an invented
 * weapon-type label. addon:104632 ("Blades") is their bundle ("Train in
 * the art of crafting edged weapons" - the same tier/text-enumeration
 * pattern as "Hafted Weapons" above).
 *
 * addon:104626 ("Weaponstones") grants whetstones/weightstones, a
 * consumable enhancement item, not equipment - not a slot claim at all,
 * curated or otherwise.
 *
 * The Craftsmithing tree (addon:104258 root) adds Profession Gear:
 *   - addon:104256 ("Trade Accessories"): "Improve your ability to craft
 *     Profession Accessories" -> the real captured PROFESSION_ACCESSORY
 *     slot (INVTYPE_PROFESSION_GEAR). Blacksmithing has only this one
 *     node targeting it - no multi-specific-node collision within this
 *     profession (real captured recipes: Blacksmith's/Leatherworker's
 *     Toolboxes, Needle Sets - Blizzard's own node text does not
 *     distinguish which target profession, so neither does this claim).
 *   - addon:104257 ("Trade Tools"): same reasoning, for the real captured
 *     PROFESSION_TOOL slot (real recipes: Blacksmith's Hammers,
 *     Leatherworker's Knives, Skinning Knives, Pickaxes, Sickles).
 *   - addon:104255 ("Tool Stones"): "consumable items which temporarily
 *     enhance... Profession Tools" - a consumable buff, not equipment -
 *     left unmapped.
 */
export const blacksmithingSpecializationEquipmentNodes: Record<
  string,
  SpecializationEquipmentSlotClaim[]
> = {
  "addon:104564": [
    slotClaim("PLATE", "Plate", "HANDS", "Hands", false, ARMOR_GROUP)
  ], // Gauntlets

  "addon:104565": [
    slotClaim("PLATE", "Plate", "WRIST", "Wrist", false, ARMOR_GROUP)
  ], // Vambraces

  "addon:104566": [
    slotClaim("PLATE", "Plate", "WAIST", "Waist", false, ARMOR_GROUP)
  ], // Belts

  "addon:104567": [
    slotClaim("PLATE", "Plate", "WAIST", "Waist", true, ARMOR_GROUP),
    slotClaim("PLATE", "Plate", "WRIST", "Wrist", true, ARMOR_GROUP),
    slotClaim("PLATE", "Plate", "HANDS", "Hands", true, ARMOR_GROUP)
  ], // Articulating Armor (bundle: waist, wrist, hand armor)

  "addon:104568": [
    slotClaim("PLATE", "Plate", "FEET", "Feet", false, ARMOR_GROUP)
  ], // Sabatons

  "addon:104569": [
    slotClaim("PLATE", "Plate", "SHOULDER", "Shoulder", false, ARMOR_GROUP)
  ], // Pauldrons

  "addon:104570": [
    slotClaim("PLATE", "Plate", "HEAD", "Head", false, ARMOR_GROUP)
  ], // Helms

  "addon:104571": [
    slotClaim("PLATE", "Plate", "HEAD", "Head", true, ARMOR_GROUP),
    slotClaim("PLATE", "Plate", "SHOULDER", "Shoulder", true, ARMOR_GROUP),
    slotClaim("PLATE", "Plate", "FEET", "Feet", true, ARMOR_GROUP)
  ], // Sculpted Armor (bundle: head, shoulder, foot armor)

  "addon:104572": [
    slotClaim(null, "Shield", "OFF_HAND", "Shield", false, ARMOR_GROUP)
  ], // Shields

  "addon:104573": [
    slotClaim("PLATE", "Plate", "LEGS", "Legs", false, ARMOR_GROUP)
  ], // Greaves

  "addon:104574": [
    slotClaim("PLATE", "Plate", "CHEST", "Chest", false, ARMOR_GROUP)
  ], // Chestplates

  "addon:104575": [
    slotClaim("PLATE", "Plate", "CHEST", "Chest", true, ARMOR_GROUP),
    slotClaim("PLATE", "Plate", "LEGS", "Legs", true, ARMOR_GROUP),
    slotClaim(null, "Shield", "OFF_HAND", "Shield", true, ARMOR_GROUP)
  ], // Large Plate Armor (bundle: chest armor, leg armor, and shields)

  "addon:104627": [
    weaponTypeClaim(
      "blacksmithing.weapon.axe",
      "AXE",
      "Axe",
      false
    ),
    weaponTypeClaim(
      "blacksmithing.weapon.polearm",
      "POLEARM",
      "Polearm",
      false
    )
  ], // Axes and Polearms

  "addon:104628": [
    weaponTypeClaim(
      "blacksmithing.weapon.mace",
      "MACE",
      "Mace",
      false
    )
  ], // Maces

  "addon:104629": [
    weaponTypeClaim(
      "blacksmithing.weapon.axe",
      "AXE",
      "Axe",
      true
    ),
    weaponTypeClaim(
      "blacksmithing.weapon.mace",
      "MACE",
      "Mace",
      true
    ),
    weaponTypeClaim(
      "blacksmithing.weapon.polearm",
      "POLEARM",
      "Polearm",
      true
    )
  ], // Hafted Weapons (bundle: maces, axes, and polearms)

  "addon:104630": [
    weaponCategoryClaim(
      "blacksmithing.weapon.long_blades",
      "LONG_BLADES",
      "Long Blades",
      false
    )
  ], // Long Blades (verified Weapons category, unverified weapon subclass)

  "addon:104631": [
    weaponCategoryClaim(
      "blacksmithing.weapon.short_blades",
      "SHORT_BLADES",
      "Short Blades",
      false
    )
  ], // Short Blades (verified Weapons category, unverified weapon subclass)

  "addon:104632": [
    weaponCategoryClaim(
      "blacksmithing.weapon.long_blades",
      "LONG_BLADES",
      "Long Blades",
      true
    ),
    weaponCategoryClaim(
      "blacksmithing.weapon.short_blades",
      "SHORT_BLADES",
      "Short Blades",
      true
    )
  ], // Blades (bundle: long blades and short blades)

  "addon:104256": [
    slotClaim(
      null,
      "Profession Gear",
      "PROFESSION_ACCESSORY",
      "Profession Accessory",
      false,
      PROFESSION_GEAR_GROUP
    )
  ], // Trade Accessories

  "addon:104257": [
    slotClaim(
      null,
      "Profession Gear",
      "PROFESSION_TOOL",
      "Profession Tool",
      false,
      PROFESSION_GEAR_GROUP
    )
  ] // Trade Tools
};
