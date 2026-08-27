import type {
  CharacterControlDetailResponse,
  OverviewResponse
} from "./overview.types.js";

/*
 * Pure narrowing from the full Overview read model to one character's
 * Character Detail Hub payload - no new aggregation, no DB access.
 * Extracted so the "find the right character, never another one"
 * behavior is independently unit-testable (see filterPinnedTrackerColumns
 * for the same pattern).
 */
export function findCharacterControlDetail(
  overview: OverviewResponse,
  characterId: string
): CharacterControlDetailResponse | null {
  const character =
    overview.characters.find(
      (state) =>
        state.character.id ===
        characterId
    );

  if (!character) {
    return null;
  }

  return {
    period: overview.summary.period,
    character,
    trackerColumns:
      overview.trackerColumns
  };
}
