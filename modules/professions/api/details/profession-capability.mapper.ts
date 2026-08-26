import type { ProfessionDetailRepository } from "./profession-detail.repository.js";
import type {
  ProfessionCapabilityCoverage
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

type AggregatedCapability =
  ProfessionCapabilityCoverage & {
    sortOrder: number;
  };

/*
 * EQUIPMENT_FAMILY, WEAPON_TYPE, and EQUIPMENT_SLOT capabilities are
 * intentionally excluded here. Surfacing them as independent rows (e.g.
 * "Mail" next to "Wrist", or "Sword" next to "Two-Hand") lets a reader
 * combine facts from two unrelated recipes into an unearned "Mail Wrist"
 * or "2H Sword" claim. The only safe, combined claim is produced by
 * profession-equipment-coverage.mapper.ts, which requires both to originate
 * from the SAME learned recipe.
 */
const EXCLUDED_CAPABILITY_TYPES =
  new Set([
    "EQUIPMENT_FAMILY",
    "WEAPON_TYPE",
    "EQUIPMENT_SLOT"
  ]);

export function mapProfessionCapabilities(
  assignment: DetailAssignment
): ProfessionCapabilityCoverage[] {
  const capabilityById =
    new Map<
      string,
      AggregatedCapability
    >();

  for (
    const learnedRecipe of
    assignment.recipes
  ) {
    for (
      const relation of
      learnedRecipe
        .recipe
        .capabilities
    ) {
      const capability =
        relation.capability;

      if (
        EXCLUDED_CAPABILITY_TYPES.has(
          capability.type
        )
      ) {
        continue;
      }

      const existing =
        capabilityById.get(
          capability.id
        );

      if (existing) {
        existing.recipeCount +=
          1;

        if (relation.isPrimary) {
          existing.primaryRecipeCount +=
            1;
        }

        continue;
      }

      capabilityById.set(
        capability.id,
        {
          id:
            capability.id,

          key:
            capability.key,

          name:
            capability.name,

          type:
            capability.type,

          slotKey:
            capability.slotKey,

          description:
            capability.description,

          expansion:
            capability.expansion,

          recipeCount:
            1,

          primaryRecipeCount:
            relation.isPrimary
              ? 1
              : 0,

          sortOrder:
            capability.sortOrder
        }
      );
    }
  }

  return [
    ...capabilityById.values()
  ]
    .sort(
      compareCapabilities
    )
    .map(
      toPublicCapability
    );
}

function compareCapabilities(
  left:
    AggregatedCapability,
  right:
    AggregatedCapability
): number {
  return (
    left.type.localeCompare(
      right.type,
      "de"
    ) ||
    left.expansion.localeCompare(
      right.expansion,
      "de"
    ) ||
    left.sortOrder -
      right.sortOrder ||
    left.name.localeCompare(
      right.name,
      "de"
    )
  );
}

function toPublicCapability(
  capability:
    AggregatedCapability
): ProfessionCapabilityCoverage {
  return {
    id:
      capability.id,

    key:
      capability.key,

    name:
      capability.name,

    type:
      capability.type,

    slotKey:
      capability.slotKey,

    description:
      capability.description,

    expansion:
      capability.expansion,

    recipeCount:
      capability.recipeCount,

    primaryRecipeCount:
      capability.primaryRecipeCount
  };
}