import { mapProfessionCapabilities } from "./profession-capability.mapper.js";
import type { ProfessionDetailRepository } from "./profession-detail.repository.js";
import type {
  ProfessionCharacterCoverage
} from "./profession-detail.types.js";
import { mapProfessionEquipmentCoverage } from "./profession-equipment-coverage.mapper.js";
import { mapProfessionGeneralSpecialization } from "./profession-general-specialization.mapper.js";
import type {
  SpecializationNodeCatalogEntry
} from "./profession-explicit-slot-node.mapper.js";
import { mapProfessionExplicitSlotNodeRanks } from "./profession-explicit-slot-node.mapper.js";
import { mapProfessionSlotSpecializationNodes } from "./profession-slot-specialization-nodes.mapper.js";
import { mapProfessionRecipeCoverage } from "./profession-recipe-coverage.mapper.js";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";

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

export function mapProfessionCharacterCoverage(
  assignment: DetailAssignment,
  hasSpecializationCatalog: boolean,
  hasRecipeCatalog: boolean,
  hasCapabilityCatalog: boolean,
  specializationMappingAvailable: boolean,
  specializationNodeCatalog: Map<
    string,
    SpecializationNodeCatalogEntry
  >,
  professionKey: string
): ProfessionCharacterCoverage {
  const craftableEquipment =
    mapProfessionEquipmentCoverage(
      assignment
    );

  const specializationEquipment =
    mapProfessionSpecializationEquipment(
      assignment,
      professionKey
    );

  const generalSpecialization =
    mapProfessionGeneralSpecialization(
      assignment,
      professionKey
    );

  const explicitSlotNodeRanks =
    specializationMappingAvailable
      ? mapProfessionExplicitSlotNodeRanks(
          assignment,
          specializationNodeCatalog,
          professionKey
        )
      : [];

  const slotSpecializationNodes =
    specializationMappingAvailable
      ? mapProfessionSlotSpecializationNodes(
          assignment,
          specializationNodeCatalog,
          professionKey
        )
      : [];

  const hasSpecializationProgress =
    assignment.nodeProgress.length >
    0;

  const recipes =
    mapProfessionRecipeCoverage(
      assignment
    );

  const capabilities =
    mapProfessionCapabilities(
      assignment
    );

  return {
    characterProfessionId:
      assignment.id,

    character: {
      id:
        assignment.character.id,

      name:
        assignment.character.name,

      realm:
        assignment.character.realm,

      className:
        assignment.character.className,

      level:
        assignment.character.level
    },

    skill:
      assignment.skill,

    knowledgePoints:
      assignment.knowledgePoints,

    dataStatus:
      resolveDataStatus(
        hasSpecializationCatalog,
        hasRecipeCatalog,
        hasCapabilityCatalog,
        hasSpecializationProgress,
        craftableEquipment.length,
        recipes.length,
        capabilities.length
      ),

    craftableEquipment,
    specializationEquipment,
    generalSpecialization,
    explicitSlotNodeRanks,
    slotSpecializationNodes,

    recipes,
    capabilities
  };
}

function resolveDataStatus(
  hasSpecializationCatalog: boolean,
  hasRecipeCatalog: boolean,
  hasCapabilityCatalog: boolean,
  hasSpecializationProgress: boolean,
  craftableEquipmentCount: number,
  recipeCount: number,
  capabilityCount: number
): ProfessionCharacterCoverage["dataStatus"] {
  if (
    craftableEquipmentCount > 0 ||
    recipeCount > 0 ||
    capabilityCount > 0
  ) {
    return "TRACKED";
  }

  if (
    !hasSpecializationCatalog &&
    !hasRecipeCatalog &&
    !hasCapabilityCatalog
  ) {
    return "NO_CATALOG";
  }

  if (hasSpecializationProgress) {
    return "PARTIAL";
  }

  return "UNTRACKED";
}