import type { CharacterDataHealth } from "../data-health/data-health.types.js";
import { characterNeedsRefresh } from "../data-health/data-health.mapper.js";
import type {
  TagAssignment,
  TagView
} from "../tags/tag.types.js";
import type {
  CharacterOverviewRow,
  CharacterWeeklyState
} from "./overview.types.js";

function defaultHealth(
  characterId: string
): CharacterDataHealth {
  return {
    characterId,
    character: {
      state: "MANUAL",
      lastSyncedAt: null
    },
    professions: {
      state: "NOT_TRACKED",
      items: []
    },
    gear: {
      state: "NOT_TRACKED",
      lastSyncedAt: null
    },
    resources: {
      state: "NOT_TRACKED",
      lastSyncedAt: null
    },
    professionWeekly: {
      state: "NOT_TRACKED",
      items: []
    }
  };
}

/*
 * Pure grouping - no DB access, no business logic beyond "which tags
 * belong to which character," extracted so it stays independently
 * unit-testable (see filterPinnedTrackerColumns for the same pattern).
 */
export function buildTagsByCharacterId(
  tags: TagView[],
  assignments: TagAssignment[]
): Map<string, TagView[]> {
  const tagById = new Map(
    tags.map((tag) => [tag.id, tag])
  );

  const result = new Map<
    string,
    TagView[]
  >();

  for (const assignment of assignments) {
    const tag = tagById.get(
      assignment.tagId
    );

    if (!tag) {
      continue;
    }

    const existing =
      result.get(
        assignment.characterId
      ) ?? [];

    existing.push(tag);
    result.set(
      assignment.characterId,
      existing
    );
  }

  return result;
}

/*
 * Attaches tags/health AFTER the core aggregation already ran - never
 * participates in readinessState/attentionItems/nextAction, so
 * overview.aggregator.ts's tested pure-function chain never needs to
 * know either concept exists.
 */
export function attachCharacterExtras(
  characters: CharacterWeeklyState[],
  tagsByCharacterId: Map<
    string,
    TagView[]
  >,
  healthByCharacterId: Map<
    string,
    CharacterDataHealth
  >
): {
  characters: CharacterOverviewRow[];
  refreshNeededCount: number;
} {
  const charactersWithExtras: CharacterOverviewRow[] =
    characters.map((state) => ({
      ...state,
      tags:
        tagsByCharacterId.get(
          state.character.id
        ) ?? [],
      health:
        healthByCharacterId.get(
          state.character.id
        ) ??
        defaultHealth(
          state.character.id
        )
    }));

  const refreshNeededCount =
    charactersWithExtras.filter(
      (state) =>
        characterNeedsRefresh(
          state.health
        )
    ).length;

  return {
    characters: charactersWithExtras,
    refreshNeededCount
  };
}
