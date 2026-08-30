import type { TagView } from "../tags/tag.types.js";
import type { OverviewGearCharacterInput } from "./overview-gear-state.mapper.js";
import type { OverviewProfessionCharacterInput } from "./overview-profession-state.mapper.js";
import type { OverviewProfessionKnowledgeTreasureCharacterInput } from "./overview-profession-knowledge-treasure-state.mapper.js";
import type { OverviewProfessionWeeklyCharacterInput } from "./overview-profession-weekly-state.mapper.js";
import type { OverviewResourceCharacterInput } from "./overview-resource-state.mapper.js";
import type { OverviewVaultCharacterInput } from "./overview-vault-state.mapper.js";
import type { OverviewWeeklyCharacterInput } from "./overview-weekly-state.mapper.js";
import { resolveCharacterState } from "./overview.aggregator.character.js";
import { sortCharacterWeeklyStates } from "./overview.sorting.js";
import type {
  AttentionItem,
  CharacterTrackerState,
  CharacterWeeklyState,
  OverviewSummaryBase
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
  weeklyByCharacterId: Map<string, OverviewWeeklyCharacterInput>;
  vaultByCharacterId: Map<string, OverviewVaultCharacterInput>;
  gearByCharacterId: Map<string, OverviewGearCharacterInput>;
  professionByCharacterId: Map<
    string,
    OverviewProfessionCharacterInput
  >;
  resourceByCharacterId: Map<string, OverviewResourceCharacterInput>;
  professionWeeklyByCharacterId: Map<
    string,
    OverviewProfessionWeeklyCharacterInput
  >;
  professionKnowledgeTreasureByCharacterId: Map<
    string,
    OverviewProfessionKnowledgeTreasureCharacterInput
  >;
  /*
   * Pre-fetched, already-batched pinned tracker states (see
   * TrackerValueService.getStatesForScope) - the aggregator only
   * distributes them per character, it never queries or computes
   * tracker completion itself.
   */
  trackerStatesByCharacterId: Map<string, CharacterTrackerState[]>;
  tagsByCharacterId?: Map<string, TagView[]>;
};

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
  summary: OverviewSummaryBase;
} {
  const characters = input.characters.map((character) =>
    resolveCharacterState(character, input)
  );

  const sortedCharacters = sortCharacterWeeklyStates(characters);

  const attentionItems = sortedCharacters.flatMap(
    (state) => state.attentionItems
  );

  const readyCount = sortedCharacters.filter(
    (state) => state.readinessState === "ready"
  ).length;

  const attentionCount = sortedCharacters.filter(
    (state) => state.readinessState === "attention"
  ).length;

  const weeklyProgress = sortedCharacters.reduce(
    (total, state) => ({
      completed: total.completed + state.weekly.completed,
      total: total.total + state.weekly.total
    }),
    { completed: 0, total: 0 }
  );

  const vaultTrackedCount = sortedCharacters.filter(
    (state) => state.vault.state !== "UNKNOWN"
  ).length;

  const vaultFullyUnlockedCount = sortedCharacters.filter(
    (state) => state.vault.state === "READY"
  ).length;

  return {
    characters: sortedCharacters,
    attentionItems,
    summary: {
      period: input.period,
      characterCount: sortedCharacters.length,
      readyCount,
      attentionCount,
      weeklyProgress,
      vault: {
        trackedCount: vaultTrackedCount,
        fullyUnlockedCount: vaultFullyUnlockedCount
      }
    }
  };
}
