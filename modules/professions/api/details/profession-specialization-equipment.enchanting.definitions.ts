import { slotClaim } from "./profession-specialization-equipment.types.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

/*
 * Enchanting - Transitories, Tonics, and Tools tree only (addon:107689
 * root), and only its non-colliding leaves. Real captured EQUIPMENT_SLOT
 * capabilities confirm both targets exist (Profession Tool: 3 recipes,
 * Ranged: 2 recipes - see addon-import.recipe-output-capability.ts,
 * INVTYPE_PROFESSION_TOOL and INVTYPE_RANGEDRIGHT/wands):
 *   - addon:107686 ("Reputable Rods"): "creating better enchanting rods"
 *     -> PROFESSION_TOOL (enchanting rods ARE Enchanting's own profession
 *     tool)
 *   - addon:107685 ("Worthy Wands"): "create wands ... in combat"
 *     -> RANGED (wands are Blizzard-classified INVTYPE_RANGEDRIGHT)
 *   - addon:107687 ("Outstanding Outfits"): "synthesizing usable
 *     equipment, making the best enchanting rods and combat wands around"
 *     -> bundle of the above two (the only two equippable items this
 *     tree crafts)
 *
 * Deliberately NOT curated:
 *   - addon:107684 ("Excellent Expendables", reagents/mana oils) and
 *     addon:107688 ("Mastering Mirages", illusions): both tie only to
 *     RECIPE_GROUP capabilities (Consumables/Illusions/Gleeful Glamours),
 *     never an EQUIPMENT_SLOT.
 *   - Elevating Equipment tree (Worldsoul Wards/Azerothian Arms/Berserker
 *     Brawn/Zul'Aman Zeal/Eversong Empowerments/Silvermoon's Spellpower/
 *     Nature's Novelties/Trollish Tools/Quel'Thalas Quality/Haranir
 *     Heightening/Thalassian Talents): every leaf's own text names real
 *     equipment slots ("Helm, Shoulder, and Boot enchantments" / "Weapon,
 *     Chest, and Ring enchantments"), but those are captured only as
 *     RECIPE_GROUP rows (Helm Enchants, Shoulder Enchants, Weapon
 *     Enchants, Rings Enchants, etc. - Blizzard's own recipe-browser
 *     category names), never as EQUIPMENT_SLOT capabilities, since an
 *     enchant recipe's own crafted output (a scroll/formula) is not
 *     itself equippable. There is no ID shared between the node and the
 *     capability here - only two independently-authored strings that
 *     happen to both say "Helm" - which is exactly the "description
 *     text matching" this project avoids. This is a genuine data gap
 *     STOP, not an oversight.
 *   - Spellbound Shatterer / Disenchanting Delegate (general
 *     Multicraft/Ingenuity/disenchanting-skill bonus trees): general,
 *     no slot to claim.
 */
export const enchantingSpecializationEquipmentNodes: Record<
  string,
  SpecializationEquipmentSlotClaim[]
> = {
  "addon:107685": [
    slotClaim(null, "Equipment", "RANGED", "Ranged", false)
  ], // Worthy Wands

  "addon:107686": [
    slotClaim(null, "Equipment", "PROFESSION_TOOL", "Profession Tool", false)
  ], // Reputable Rods

  "addon:107687": [
    slotClaim(null, "Equipment", "RANGED", "Ranged", true),
    slotClaim(null, "Equipment", "PROFESSION_TOOL", "Profession Tool", true)
  ] // Outstanding Outfits (bundle: wands and rods)
};
