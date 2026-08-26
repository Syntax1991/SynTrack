import { slotClaim } from "./profession-specialization-equipment.types.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

/*
 * Jewelcrafting - Alluring Accessories tree only (addon:107059 root).
 * addon:107057 ("Luxurious Lockets") reads "gaining +$ev1 $en1 when
 * crafting Necklaces" and addon:107058 ("Regal Rings") reads "gaining
 * +$ev1 $en1 when crafting them" (rings) - both a direct, Blizzard-
 * authored 1:1 match to the NECK/FINGER slot enum
 * (resolveRecipeOutputSlot, addon-import.recipe-output-capability.ts).
 * Jewelcrafting has no armor-type EQUIPMENT_FAMILY (it never crafts
 * armor), so these claims carry no familyKey/familyName pairing beyond a
 * plain descriptive label - the normalized capability model does not
 * require every profession to populate a family.
 *
 * addon:107056 ("Crafting Couture", Profession Tools/Accessories) is
 * deliberately NOT curated: that capability is only ever captured as a
 * RECIPE_GROUP (Blizzard's own recipe-browser category name, see
 * createCategoryCapability in
 * addon-import.recipe.capability.persistence.ts), which has no shared ID
 * with a specialization node - tying the two together would require
 * matching the node's own text against a recipe category name, which is
 * exactly the "recipe/category name matching" this project avoids.
 *
 * Jewelcrafting's other trees (Thoughtful Throughput, Proficient
 * Processor, Glamorous Gems - the per-gem-type cutting tree) are left
 * uncurated for the same reason: every leaf ties to a RECIPE_GROUP
 * ("Peridots", "Garnets", etc.), never to an EQUIPMENT_FAMILY/
 * EQUIPMENT_SLOT capability. This is a genuine data-gap STOP, not an
 * oversight - see the profession task report for the full reasoning.
 */
export const jewelcraftingSpecializationEquipmentNodes: Record<
  string,
  SpecializationEquipmentSlotClaim[]
> = {
  "addon:107057": [
    slotClaim(null, "Jewelry", "NECK", "Neck", false)
  ], // Luxurious Lockets

  "addon:107058": [
    slotClaim(null, "Jewelry", "FINGER", "Ring", false)
  ] // Regal Rings
};
