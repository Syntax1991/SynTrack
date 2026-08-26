import type { ProfessionDetailRepository } from "./profession-detail.repository.js";
import type {
  ProfessionEquipmentCraftEntry
} from "./profession-detail.types.js";

type DetailRecord =
  NonNullable<
    Awaited<
      ReturnType<
        ProfessionDetailRepository["findById"]
      >
    >
  >;

type DetailAssignment =
  DetailRecord["assignments"][number];

type LearnedRecipe =
  DetailAssignment["recipes"][number];

type RecipeCapabilityRelation =
  LearnedRecipe["recipe"]["capabilities"][number];

const EQUIPMENT_FAMILY_TYPE =
  "EQUIPMENT_FAMILY";

const WEAPON_TYPE_TYPE =
  "WEAPON_TYPE";

const FAMILY_LIKE_TYPES =
  new Set([
    EQUIPMENT_FAMILY_TYPE,
    WEAPON_TYPE_TYPE
  ]);

const EQUIPMENT_SLOT_TYPE =
  "EQUIPMENT_SLOT";

/*
 * A character may only claim "can craft" a concrete family + slot
 * combination (e.g. "Leather Wrist", or "Sword Two-Hand") when a single
 * learned recipe carries BOTH a family-like capability (EQUIPMENT_FAMILY
 * for armor, WEAPON_TYPE for weapons - structurally identical: a
 * material/type fact that only combines safely with a slot fact from the
 * very same recipe) and an EQUIPMENT_SLOT capability. Aggregating "has any
 * Mail recipe" with "has any Wrist recipe" across different recipes would
 * recreate the false-conjunction bug this mapper replaces.
 */
export function mapProfessionEquipmentCoverage(
  assignment: DetailAssignment
): ProfessionEquipmentCraftEntry[] {
  const entriesById =
    new Map<
      string,
      ProfessionEquipmentCraftEntry
    >();

  for (
    const learnedRecipe of
    assignment.recipes
  ) {
    const pair =
      findFamilySlotPair(
        learnedRecipe.recipe
          .capabilities
      );

    if (!pair) {
      continue;
    }

    const existing =
      entriesById.get(
        pair.id
      );

    if (existing) {
      existing.recipeCount +=
        1;

      continue;
    }

    entriesById.set(
      pair.id,
      {
        id:
          pair.id,

        familyName:
          pair.familyName,

        slotKey:
          pair.slotKey,

        slotName:
          pair.slotName,

        recipeCount:
          1
      }
    );
  }

  return [
    ...entriesById.values()
  ].sort(
    compareEquipmentEntries
  );
}

function findFamilySlotPair(
  capabilities:
    RecipeCapabilityRelation[]
): {
  id: string;
  familyName: string;
  slotKey: string;
  slotName: string;
} | null {
  const family =
    capabilities.find(
      (relation) =>
        FAMILY_LIKE_TYPES.has(
          relation.capability
            .type
        )
    )?.capability ??
    null;

  const slot =
    capabilities.find(
      (relation) =>
        relation.capability
          .type ===
        EQUIPMENT_SLOT_TYPE
    )?.capability ??
    null;

  if (
    !family ||
    !slot ||
    !slot.slotKey
  ) {
    return null;
  }

  return {
    id:
      `${family.id}:${slot.id}`,

    familyName:
      family.name,

    slotKey:
      slot.slotKey,

    slotName:
      slot.name
  };
}

function compareEquipmentEntries(
  left:
    ProfessionEquipmentCraftEntry,
  right:
    ProfessionEquipmentCraftEntry
): number {
  return (
    left.familyName.localeCompare(
      right.familyName,
      "en"
    ) ||
    left.slotName.localeCompare(
      right.slotName,
      "en"
    )
  );
}
