import { slotClaim } from "./profession-specialization-equipment.types.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

/*
 * Engineering - Combat Analytics tree only (addon:109141 root), and only
 * its non-colliding leaves. Real captured EQUIPMENT_SLOT capabilities
 * confirm every target (Feet: 16, Head: 16, Wrist: 16, Ranged: 3 recipes -
 * see addon-import.recipe-output-capability.ts):
 *   - addon:109138 ("Boots"): "craft various boots" -> FEET
 *   - addon:109139 ("Bracers"): "craft various bracers" -> WRIST
 *   - addon:109140 ("Goggles"): "craft various goggles" -> HEAD (goggles
 *     are Blizzard-classified INVTYPE_HEAD, same slot as helms)
 *   - addon:110352 ("Guns"): "craft various guns" -> RANGED
 * These four are genuinely parallel single-slot leaves (no bundle node
 * ties them together in this tree - each stands alone), so no isBundle
 * claim is curated here.
 *
 * Deliberately NOT curated, and left for a future explicit decision:
 *   - Market Mobility tree (addon:106711-106719: Engineering Tools /
 *     Tailoring Tools / Jewelcrafting Tools / Mandatory Tools / Fishing
 *     Rods / Mining Accessories / Engineering Accessories / Finishing
 *     Touches): each node genuinely targets a captured EQUIPMENT_SLOT
 *     (PROFESSION_TOOL: 12 recipes, PROFESSION_ACCESSORY: 9 recipes,
 *     Ranged - Fishing Rods use INVTYPE_RANGEDRIGHT too), but FOUR
 *     different specific nodes ("Engineering Tools", "Tailoring Tools",
 *     "Jewelcrafting Tools", "Mandatory Tools") all claim the SAME
 *     PROFESSION_TOOL slot key, and several more collide on
 *     PROFESSION_ACCESSORY/RANGED. The current mapper design (one
 *     specific node per family+slot pair) has no rule for this many
 *     equally-specific nodes sharing a pair; curating any of them would
 *     silently hide investment in the others. This needs an explicit
 *     multi-specific-per-pair design, not a workaround - the exact same
 *     gap identified in Inscription's Blueprints (Profession Tool) and
 *     Darkmoon Curiosity (Trinket) trees.
 *   - Recycling / Bits and Bots trees (general Multicraft/
 *     Resourcefulness/Ingenuity/reagent-recycling bonus): general, no
 *     slot to claim.
 *   - The EQUIPMENT_FAMILY:Cloth/Leather/Mail/Plate capabilities captured
 *     for Engineering (12 recipes each) do not correspond to any
 *     Engineering specialization node's own text (no node mentions an
 *     armor family) - left unmapped rather than guessed.
 */
export const engineeringSpecializationEquipmentNodes: Record<
  string,
  SpecializationEquipmentSlotClaim[]
> = {
  "addon:109138": [
    slotClaim(null, "Gearcraft", "FEET", "Feet", false)
  ], // Boots

  "addon:109139": [
    slotClaim(null, "Gearcraft", "WRIST", "Wrist", false)
  ], // Bracers

  "addon:109140": [
    slotClaim(null, "Gearcraft", "HEAD", "Head", false)
  ], // Goggles

  "addon:110352": [
    slotClaim(null, "Gearcraft", "RANGED", "Ranged", false)
  ] // Guns
};
