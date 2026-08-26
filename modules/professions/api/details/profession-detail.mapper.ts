import {
  mapProfessionCharacterCoverage
} from "./profession-coverage.mapper.js";
import type { ProfessionDetailRepository } from "./profession-detail.repository.js";
import type {
  ProfessionCharacterCoverage,
  ProfessionDetailView
} from "./profession-detail.types.js";
import { buildSpecializationNodeCatalog } from "./profession-explicit-slot-node.mapper.js";
import { professionsWithSpecializationEquipmentMapping } from "./profession-specialization-equipment.definitions.js";

type DetailRecord =
  NonNullable<
    Awaited<
      ReturnType<
        ProfessionDetailRepository["findById"]
      >
    >
  >;

export function mapProfessionDetail(
  profession: DetailRecord
): ProfessionDetailView {
  const hasSpecializationCatalog =
    profession
      .specializationTrees
      .length > 0;

  const hasRecipeCatalog =
    profession
      .recipes
      .length > 0;

  const hasCapabilityCatalog =
    profession
      .capabilities
      .length > 0;

  const specializationMappingAvailable =
    professionsWithSpecializationEquipmentMapping.has(
      profession.key
    );

  const specializationNodeCatalog =
    buildSpecializationNodeCatalog(
      profession.specializationTrees
    );

  const characters =
    profession.assignments
      .map(
        (assignment) =>
          mapProfessionCharacterCoverage(
            assignment,
            hasSpecializationCatalog,
            hasRecipeCatalog,
            hasCapabilityCatalog,
            specializationMappingAvailable,
            specializationNodeCatalog,
            profession.key
          )
      )
      .sort(
        compareCharacterCoverage
      );

  const trackedCharacterCount =
    characters.filter(
      (character) =>
        character.dataStatus ===
        "TRACKED"
    ).length;

  return {
    profession: {
      id:
        profession.id,

      key:
        profession.key,

      name:
        profession.name,

      category:
        profession.category
    },

    specializationMappingAvailable,

    summary: {
      characterCount:
        characters.length,

      trackedCharacterCount,

      missingCharacterCount:
        characters.length -
        trackedCharacterCount,

      craftableEquipmentCount:
        sumCraftableEquipmentCoverage(
          characters
        ),

      catalogRecipeCount:
        profession
          .recipes
          .length,

      learnedRecipeCount:
        sumRecipeCoverage(
          characters
        ),

      catalogCapabilityCount:
        profession
          .capabilities
          .length,

      coveredCapabilityCount:
        countCoveredCapabilities(
          characters
        )
    },

    characters
  };
}

function sumCraftableEquipmentCoverage(
  characters:
    ProfessionCharacterCoverage[]
): number {
  return characters.reduce(
    (
      total,
      character
    ) =>
      total +
      character
        .craftableEquipment
        .length,
    0
  );
}

function sumRecipeCoverage(
  characters:
    ProfessionCharacterCoverage[]
): number {
  return characters.reduce(
    (
      total,
      character
    ) =>
      total +
      character.recipes.length,
    0
  );
}

function countCoveredCapabilities(
  characters:
    ProfessionCharacterCoverage[]
): number {
  const capabilityIds =
    new Set<string>();

  for (
    const character of
    characters
  ) {
    for (
      const capability of
      character.capabilities
    ) {
      capabilityIds.add(
        capability.id
      );
    }
  }

  return capabilityIds.size;
}

function compareCharacterCoverage(
  left:
    ProfessionCharacterCoverage,
  right:
    ProfessionCharacterCoverage
): number {
  return (
    left.character.name.localeCompare(
      right.character.name,
      "de"
    ) ||
    left.character.realm.localeCompare(
      right.character.realm,
      "de"
    )
  );
}