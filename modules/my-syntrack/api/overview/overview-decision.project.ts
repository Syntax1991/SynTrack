/**
 * Character-level Overview projection.
 * Collapses raw OverviewActionCandidates into compact decision surfaces.
 * Does not invent domain actions — only groups and selects from candidates.
 */

import type {
  OverviewActionCandidate,
  OverviewDecisionProjection,
  OverviewGameplayPriorityRow,
  OverviewProfessionWorkRow,
  OverviewSetupAttentionRow
} from "./overview-decision.types.js";

export type OverviewSeasonCharacterFacts = {
  characterId: string;
  goalsOpen: number;
  goalsUnknown: number;
};

export type OverviewGameplayCharacterSeed = {
  characterId: string;
  characterName: string;
  className: string;
};

export function formatOverviewGameplayStatus(
  knownOpen: number,
  unknown: number
): string {
  if (knownOpen <= 0 && unknown <= 0) {
    return "✓";
  }

  const parts: string[] = [];

  if (knownOpen > 0) {
    parts.push(`${knownOpen} open`);
  }

  if (unknown > 0) {
    parts.push(`${unknown} unknown`);
  }

  return parts.join(" · ");
}

function sortCandidates(
  left: OverviewActionCandidate,
  right: OverviewActionCandidate
): number {
  const localDiff = left.localOrder - right.localOrder;

  if (localDiff !== 0) {
    return localDiff;
  }

  const actionDiff = left.action.localeCompare(right.action, "en");

  if (actionDiff !== 0) {
    return actionDiff;
  }

  return left.characterId.localeCompare(right.characterId, "en");
}

function groupByCharacter(
  actions: OverviewActionCandidate[]
): Map<string, OverviewActionCandidate[]> {
  const byCharacter = new Map<string, OverviewActionCandidate[]>();

  for (const action of actions) {
    const existing = byCharacter.get(action.characterId) ?? [];
    existing.push(action);
    byCharacter.set(action.characterId, existing);
  }

  for (const list of byCharacter.values()) {
    list.sort(sortCandidates);
  }

  return byCharacter;
}

export function projectOverviewGameplayPriorities(input: {
  gameplayCharacters: OverviewGameplayCharacterSeed[];
  actions: OverviewActionCandidate[];
  seasonFacts: OverviewSeasonCharacterFacts[];
}): OverviewGameplayPriorityRow[] {
  const weekliesByCharacter = groupByCharacter(
    input.actions.filter((action) => action.source === "WEEKLIES")
  );
  const seasonByCharacter = groupByCharacter(
    input.actions.filter((action) => action.source === "SEASON")
  );
  const seasonFactsById = new Map(
    input.seasonFacts.map((facts) => [facts.characterId, facts])
  );

  return input.gameplayCharacters.map((character) => {
    const weekly = weekliesByCharacter.get(character.characterId)?.[0] ?? null;
    const season = seasonByCharacter.get(character.characterId)?.[0] ?? null;
    const facts = seasonFactsById.get(character.characterId);
    const goalsOpen = facts?.goalsOpen ?? 0;
    const goalsUnknown = facts?.goalsUnknown ?? 0;
    const knownOpen = (weekly ? 1 : 0) + goalsOpen;

    let next: OverviewGameplayPriorityRow["next"] = null;
    let after: OverviewGameplayPriorityRow["after"] = null;

    if (weekly) {
      next = {
        action: weekly.action,
        path: weekly.path,
        source: "WEEKLIES"
      };
      after = season
        ? {
            action: season.action,
            path: season.path,
            source: "SEASON"
          }
        : goalsUnknown > 0
          ? { action: "?", path: "/season", source: "SEASON" }
          : null;
    } else if (season) {
      next = {
        action: season.action,
        path: season.path,
        source: "SEASON"
      };
      after = null;
    } else if (goalsUnknown > 0) {
      after = { action: "?", path: "/season", source: "SEASON" };
    }

    return {
      characterId: character.characterId,
      characterName: character.characterName,
      className: character.className,
      next,
      after,
      knownOpen,
      unknown: goalsUnknown,
      status: formatOverviewGameplayStatus(knownOpen, goalsUnknown)
    };
  });
}

export function projectOverviewProfessionWork(
  actions: OverviewActionCandidate[]
): OverviewProfessionWorkRow[] {
  const weekly = actions.filter(
    (action) =>
      action.source === "PROFESSIONS" && action.horizon === "WEEKLY"
  );
  const byCharacter = groupByCharacter(weekly);

  // Preserve first-seen Character order from Profession Overview rows.
  return [...byCharacter.values()].map((list) => {
    const first = list[0]!;
    return {
      characterId: first.characterId,
      characterName: first.characterName,
      className: first.className,
      next: {
        action: first.action,
        path: first.path
      },
      additionalActionCount: Math.max(0, list.length - 1)
    };
  });
}

export function projectOverviewSetupAttention(
  actions: OverviewActionCandidate[]
): OverviewSetupAttentionRow[] {
  const permanent = actions.filter(
    (action) =>
      action.source === "PROFESSIONS" && action.horizon === "PERMANENT"
  );
  const byCharacter = groupByCharacter(permanent);

  return [...byCharacter.values()].map((list) => {
    const first = list[0]!;
    return {
      characterId: first.characterId,
      characterName: first.characterName,
      className: first.className,
      next: {
        action: first.action,
        path: first.path
      },
      additionalActionCount: Math.max(0, list.length - 1)
    };
  });
}

export function projectOverviewDecisionSurfaces(input: {
  gameplayCharacters: OverviewGameplayCharacterSeed[];
  actions: OverviewActionCandidate[];
  seasonFacts: OverviewSeasonCharacterFacts[];
}): OverviewDecisionProjection {
  return {
    gameplayPriorities: projectOverviewGameplayPriorities(input),
    professionWork: projectOverviewProfessionWork(input.actions),
    setupAttention: projectOverviewSetupAttention(input.actions)
  };
}
