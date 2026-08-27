import type { OverviewGearCharacterInput } from "./overview-gear-state.mapper.js";
import { resolveGearOverviewState } from "./overview-gear-state.mapper.js";
import type { OverviewProfessionCharacterInput } from "./overview-profession-state.mapper.js";
import { resolveProfessionOverviewState } from "./overview-profession-state.mapper.js";
import type { OverviewVaultCharacterInput } from "./overview-vault-state.mapper.js";
import { resolveVaultOverviewState } from "./overview-vault-state.mapper.js";
import type { OverviewWeeklyCharacterInput } from "./overview-weekly-state.mapper.js";
import { resolveWeeklyOverviewState } from "./overview-weekly-state.mapper.js";
import {
  resolveEmbellishmentOverviewState,
  resolveTierOverviewState
} from "./overview-tier-embellishment-state.mapper.js";
import {
  pickNextAction,
  sortCharacterWeeklyStates
} from "./overview.sorting.js";
import type {
  AttentionItem,
  CharacterTrackerState,
  CharacterWeeklyState,
  OverviewSummary
} from "./overview.types.js";

export type OverviewAggregationInput = {
  period: {
    key: string;
    startsAt: string;
    endsAt: string;
  };
  weeklyTaskCount: number;
  characters: {
    id: string;
    name: string;
    realm: string;
    region: string;
    className: string;
    level: number;
  }[];
  weeklyByCharacterId: Map<
    string,
    OverviewWeeklyCharacterInput
  >;
  vaultByCharacterId: Map<
    string,
    OverviewVaultCharacterInput
  >;
  gearByCharacterId: Map<
    string,
    OverviewGearCharacterInput
  >;
  professionByCharacterId: Map<
    string,
    OverviewProfessionCharacterInput
  >;
  /*
   * Pre-fetched, already-batched pinned tracker states (see
   * TrackerValueService.getStatesForScope) - the aggregator only
   * distributes them per character, it never queries or computes
   * tracker completion itself.
   */
  trackerStatesByCharacterId: Map<
    string,
    CharacterTrackerState[]
  >;
};

function resolveCharacterState(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): CharacterWeeklyState {
  const weeklyInput =
    input.weeklyByCharacterId.get(
      character.id
    ) ?? {
      id: character.id,
      name: character.name,
      completedTaskKeys: []
    };

  const vaultInput =
    input.vaultByCharacterId.get(
      character.id
    ) ?? {
      id: character.id,
      name: character.name,
      runs: [],
      vaultSlots: [],
      highestKeyLevel: null
    };

  const gearInput =
    input.gearByCharacterId.get(
      character.id
    ) ?? {
      id: character.id,
      name: character.name,
      slots: [],
      trackedSlotCount: 0,
      issueCount: 0,
      readinessPercent: 0,
      averageItemLevel: null
    };

  const professionInput =
    input.professionByCharacterId.get(
      character.id
    ) ?? {
      id: character.id,
      name: character.name,
      hasTrackedProfession: false,
      partialProfessionIssues: [],
      professions: []
    };

  const weeklyResult =
    resolveWeeklyOverviewState(
      weeklyInput,
      input.weeklyTaskCount
    );

  const vaultResult =
    resolveVaultOverviewState(
      vaultInput
    );

  const gearResult =
    resolveGearOverviewState(
      gearInput
    );

  const professionResult =
    resolveProfessionOverviewState(
      professionInput
    );

  const attentionItems = [
    weeklyResult.attentionItem,
    professionResult.attentionItem,
    gearResult.attentionItem,
    vaultResult.attentionItem
  ].filter(
    (item): item is AttentionItem =>
      item !== null
  );

  const anyDomainReady =
    weeklyResult.weekly.state ===
      "READY" ||
    vaultResult.vault.state ===
      "READY" ||
    professionResult.professions
      .state === "READY" ||
    gearResult.gear.state ===
      "READY";

  const readinessState =
    attentionItems.length > 0
      ? "attention"
      : anyDomainReady
        ? "ready"
        : "unknown";

  return {
    character,
    weekly: weeklyResult.weekly,
    vault: vaultResult.vault,
    professions:
      professionResult.professions,
    gear: gearResult.gear,
    tier: resolveTierOverviewState(),
    embellishments:
      resolveEmbellishmentOverviewState(),
    trackers:
      input.trackerStatesByCharacterId.get(
        character.id
      ) ?? [],
    attentionItems,
    readinessState,
    nextAction: pickNextAction(
      attentionItems
    )
  };
}

/*
 * Overview reads and normalizes - every fact here already belongs to
 * Weekly Checklist, Vault/M+, Professions or Gear (see the per-domain
 * mappers this composes). This function persists nothing and owns no
 * completion state of its own.
 */
export function aggregateCharacterWeeklyStates(
  input: OverviewAggregationInput
): {
  characters: CharacterWeeklyState[];
  attentionItems: AttentionItem[];
  summary: OverviewSummary;
} {
  const characters =
    input.characters.map(
      (character) =>
        resolveCharacterState(
          character,
          input
        )
    );

  const sortedCharacters =
    sortCharacterWeeklyStates(
      characters
    );

  const attentionItems =
    sortedCharacters.flatMap(
      (state) => state.attentionItems
    );

  const readyCount =
    sortedCharacters.filter(
      (state) =>
        state.readinessState ===
        "ready"
    ).length;

  const attentionCount =
    sortedCharacters.filter(
      (state) =>
        state.readinessState ===
        "attention"
    ).length;

  const weeklyProgress =
    sortedCharacters.reduce(
      (total, state) => ({
        completed:
          total.completed +
          state.weekly.completed,
        total:
          total.total +
          state.weekly.total
      }),
      { completed: 0, total: 0 }
    );

  const vaultTrackedCount =
    sortedCharacters.filter(
      (state) =>
        state.vault.state !==
        "UNKNOWN"
    ).length;

  const vaultFullyUnlockedCount =
    sortedCharacters.filter(
      (state) =>
        state.vault.state ===
        "READY"
    ).length;

  return {
    characters: sortedCharacters,
    attentionItems,
    summary: {
      period: input.period,
      characterCount:
        sortedCharacters.length,
      readyCount,
      attentionCount,
      weeklyProgress,
      vault: {
        trackedCount:
          vaultTrackedCount,
        fullyUnlockedCount:
          vaultFullyUnlockedCount
      }
    }
  };
}
