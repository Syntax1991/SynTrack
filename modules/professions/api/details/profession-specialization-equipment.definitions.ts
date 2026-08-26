import { leatherworkingSpecializationEquipmentNodes } from "./profession-specialization-equipment.leatherworking.definitions.js";
import { blacksmithingSpecializationEquipmentNodes } from "./profession-specialization-equipment.blacksmithing.definitions.js";
import { tailoringSpecializationEquipmentNodes } from "./profession-specialization-equipment.tailoring.definitions.js";
import { jewelcraftingSpecializationEquipmentNodes } from "./profession-specialization-equipment.jewelcrafting.definitions.js";
import { inscriptionSpecializationEquipmentNodes } from "./profession-specialization-equipment.inscription.definitions.js";
import { engineeringSpecializationEquipmentNodes } from "./profession-specialization-equipment.engineering.definitions.js";
import { enchantingSpecializationEquipmentNodes } from "./profession-specialization-equipment.enchanting.definitions.js";
import type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

export type { SpecializationEquipmentSlotClaim } from "./profession-specialization-equipment.types.js";

/*
 * Single registry all curated-equipment mappers read through. Adding a
 * profession is: (1) a new
 * profession-specialization-equipment.<profession>.definitions.ts file,
 * hand-verified against that profession's own real, Blizzard-authored node
 * description text (never node name alone, never runtime string matching -
 * see the Leatherworking/Blacksmithing/Tailoring files for the established
 * pattern and its reasoning), and (2) one line here. No mapper file needs
 * to branch on profession key. A profession absent from this registry
 * produces no claims/candidates at all (fail closed: UNKNOWN, never a
 * guess).
 */
const specializationEquipmentNodesByProfession: Record<
  string,
  Record<string, SpecializationEquipmentSlotClaim[]>
> = {
  leatherworking: leatherworkingSpecializationEquipmentNodes,
  blacksmithing: blacksmithingSpecializationEquipmentNodes,
  tailoring: tailoringSpecializationEquipmentNodes,
  jewelcrafting: jewelcraftingSpecializationEquipmentNodes,
  inscription: inscriptionSpecializationEquipmentNodes,
  engineering: engineeringSpecializationEquipmentNodes,
  enchanting: enchantingSpecializationEquipmentNodes
};

export function getSpecializationEquipmentNodesForProfession(
  professionKey: string
): Record<string, SpecializationEquipmentSlotClaim[]> {
  return (
    specializationEquipmentNodesByProfession[professionKey] ??
    {}
  );
}

/*
 * Profession keys with a curated node table above. Used to distinguish
 * "no matching investment" (NOT_SPECIALIZED, a real proven negative) from
 * "this profession has no ID mapping yet" (UNKNOWN) - see
 * profession-specialization-equipment.mapper.ts.
 */
export const professionsWithSpecializationEquipmentMapping =
  new Set(
    Object.keys(
      specializationEquipmentNodesByProfession
    )
  );
