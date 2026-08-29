import type { OverviewAggregationInput } from "./overview.aggregator.js";
import type { OverviewProfessionCharacterInput } from "./overview-profession-state.mapper.js";
import type { OverviewProfessionKnowledgeTreasureCharacterInput } from "./overview-profession-knowledge-treasure-state.mapper.js";
import type { OverviewProfessionWeeklyCharacterInput } from "./overview-profession-weekly-state.mapper.js";
import type { OverviewResourceCharacterInput } from "./overview-resource-state.mapper.js";
import type { CharacterTrackerState } from "./overview.types.js";

type CharacterIdName = {
  id: string;
  name: string;
};

/*
 * Thin Map builders for OverviewService -> aggregator wiring. Kept out
 * of overview.service.ts so that file stays under the 350-line source
 * limit after Knowledge Treasures were added to the parallel fetch.
 */
export function buildCharacterIdMap<T extends CharacterIdName>(
  characters: T[]
): Map<string, T> {
  return new Map(
    characters.map((character) => [character.id, character])
  );
}

export function buildResourceByCharacterId(
  characters: Array<{
    id: string;
    name: string;
    resources: OverviewResourceCharacterInput["resources"];
  }>
): Map<string, OverviewResourceCharacterInput> {
  return new Map(
    characters.map((character) => [
      character.id,
      {
        id: character.id,
        name: character.name,
        resources: character.resources
      }
    ])
  );
}

export function buildProfessionByCharacterId(
  professionIssuesByCharacter: Map<
    string,
    {
      hasTrackedProfession: boolean;
      partialIssues: OverviewProfessionCharacterInput["partialProfessionIssues"];
      professions: OverviewProfessionCharacterInput["professions"];
    }
  >,
  weeklyByCharacterId: Map<string, CharacterIdName>
): Map<string, OverviewProfessionCharacterInput> {
  return new Map(
    [...professionIssuesByCharacter.entries()].map(
      ([characterId, entry]) => [
        characterId,
        {
          id: characterId,
          name: weeklyByCharacterId.get(characterId)?.name ?? "",
          hasTrackedProfession: entry.hasTrackedProfession,
          partialProfessionIssues: entry.partialIssues,
          professions: entry.professions
        }
      ]
    )
  );
}

export function buildProfessionWeeklyByCharacterId(
  characters: OverviewProfessionWeeklyCharacterInput[]
): Map<string, OverviewProfessionWeeklyCharacterInput> {
  return buildCharacterIdMap(characters);
}

export function buildProfessionKnowledgeTreasureByCharacterId(
  characters: OverviewProfessionKnowledgeTreasureCharacterInput[]
): Map<string, OverviewProfessionKnowledgeTreasureCharacterInput> {
  return buildCharacterIdMap(characters);
}

export type OverviewServiceAggregationMaps = Pick<
  OverviewAggregationInput,
  | "weeklyByCharacterId"
  | "vaultByCharacterId"
  | "gearByCharacterId"
  | "professionByCharacterId"
  | "resourceByCharacterId"
  | "professionWeeklyByCharacterId"
  | "professionKnowledgeTreasureByCharacterId"
  | "trackerStatesByCharacterId"
>;

export function emptyTrackerStatesByCharacterId(): Map<
  string,
  CharacterTrackerState[]
> {
  return new Map();
}
