import type { OverviewAggregationInput } from "./overview.aggregator.js";
import type { OverviewGearCharacterInput } from "./overview-gear-state.mapper.js";
import type { OverviewProfessionCharacterInput } from "./overview-profession-state.mapper.js";
import type { OverviewProfessionKnowledgeTreasureCharacterInput } from "./overview-profession-knowledge-treasure-state.mapper.js";
import type { OverviewProfessionWeeklyCharacterInput } from "./overview-profession-weekly-state.mapper.js";
import type { OverviewResourceCharacterInput } from "./overview-resource-state.mapper.js";
import type { OverviewVaultCharacterInput } from "./overview-vault-state.mapper.js";
import type { OverviewWeeklyCharacterInput } from "./overview-weekly-state.mapper.js";

const emptyWeeklyAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

export function resolveWeeklyInput(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): OverviewWeeklyCharacterInput {
  return (
    input.weeklyByCharacterId.get(character.id) ?? {
      id: character.id,
      name: character.name,
      completedTaskKeys: []
    }
  );
}

export function resolveVaultInput(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): OverviewVaultCharacterInput {
  return (
    input.vaultByCharacterId.get(character.id) ?? {
      id: character.id,
      name: character.name,
      runs: [],
      vaultSlots: [],
      highestKeyLevel: null
    }
  );
}

export function resolveGearInput(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): OverviewGearCharacterInput {
  return (
    input.gearByCharacterId.get(character.id) ?? {
      id: character.id,
      name: character.name,
      level: character.level,
      slots: [],
      trackedSlotCount: 0,
      issueCount: 0,
      readinessPercent: 0,
      averageItemLevel: null,
      currentExpansionId: null,
      bagPieces: []
    }
  );
}

export function resolveProfessionInput(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): OverviewProfessionCharacterInput {
  return (
    input.professionByCharacterId.get(character.id) ?? {
      id: character.id,
      name: character.name,
      hasTrackedProfession: false,
      partialProfessionIssues: [],
      professions: []
    }
  );
}

export function resolveResourceInput(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): OverviewResourceCharacterInput {
  return (
    input.resourceByCharacterId.get(character.id) ?? {
      id: character.id,
      name: character.name,
      resources: []
    }
  );
}

export function resolveProfessionWeeklyInput(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): OverviewProfessionWeeklyCharacterInput {
  return (
    input.professionWeeklyByCharacterId.get(character.id) ?? {
      id: character.id,
      name: character.name,
      quest: emptyWeeklyAggregate,
      treatise: emptyWeeklyAggregate,
      drops: emptyWeeklyAggregate,
      professions: []
    }
  );
}

export function resolveProfessionKnowledgeTreasureInput(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): OverviewProfessionKnowledgeTreasureCharacterInput {
  return (
    input.professionKnowledgeTreasureByCharacterId.get(
      character.id
    ) ?? {
      id: character.id,
      name: character.name,
      treasures: emptyWeeklyAggregate,
      professions: []
    }
  );
}
