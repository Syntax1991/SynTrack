import type { ProfessionKnowledgeTreasureProfessionSummary } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import {
  deriveProfessionNextAction,
  deriveProfessionSortRank,
  mapTreasures
} from "./profession-overview-work.action.mapper.js";
import {
  mapWeeklySource,
  resolveProfessionWeeklyRowState,
  resolveProfessionWeeklySummary
} from "./profession-overview-work.weekly.mapper.js";
import type {
  ProfessionOverviewWorkAssignment,
  ProfessionOverviewWorkRow,
  ProfessionOverviewWorkSummary,
  ProfessionOverviewWorkWeeklyProfession
} from "./profession-overview-work.types.js";

function resolveSkillDisplay(skill: number): {
  current: number | null;
  display: string;
} {
  if (skill > 0) {
    return {
      current: skill,
      display: String(skill)
    };
  }

  return {
    current: null,
    display: "?"
  };
}

function resolveKnowledgePointsDisplay(
  knowledgePoints: number
): {
  available: number | null;
  display: string;
} {
  return {
    available: knowledgePoints,
    display: String(knowledgePoints)
  };
}

export function buildProfessionOverviewWorkRow(input: {
  assignment: ProfessionOverviewWorkAssignment;
  weeklyProfession: ProfessionOverviewWorkWeeklyProfession | null;
  treasureProfession: ProfessionKnowledgeTreasureProfessionSummary | null;
}): ProfessionOverviewWorkRow {
  const quest = mapWeeklySource(input.weeklyProfession?.quest);
  const treatise = mapWeeklySource(
    input.weeklyProfession?.treatise
  );
  const drops = mapWeeklySource(input.weeklyProfession?.drops);
  const treasures = mapTreasures(
    input.treasureProfession?.treasures ?? null
  );
  const weeklyState = resolveProfessionWeeklyRowState({
    quest,
    treatise,
    drops
  });
  const weeklySummary = resolveProfessionWeeklySummary({
    quest,
    treatise,
    drops,
    state: weeklyState
  });
  const skill = resolveSkillDisplay(input.assignment.skill);
  const knowledgePoints = resolveKnowledgePointsDisplay(
    input.assignment.knowledgePoints
  );
  const nextAction = deriveProfessionNextAction({
    quest,
    treatise,
    drops,
    treasures,
    knowledgePoints: knowledgePoints.available,
    weeklyState
  });

  return {
    character: {
      id: input.assignment.characterId,
      name: input.assignment.characterName,
      realm: input.assignment.realm,
      region: input.assignment.region,
      className: input.assignment.className
    },
    profession: {
      id: input.assignment.professionId,
      key: input.assignment.professionKey,
      name: input.assignment.professionName,
      category: input.assignment.professionCategory
    },
    skill,
    knowledgePoints,
    weekly: {
      state: weeklyState,
      summary: weeklySummary
    },
    quest,
    treatise,
    drops,
    treasures,
    attention: {
      weekly: weeklyState === "ATTENTION",
      permanent: treasures.state === "INCOMPLETE"
    },
    nextAction,
    sortRank: deriveProfessionSortRank({
      weeklyState,
      treasures,
      knowledgePoints: knowledgePoints.available
    })
  };
}

export function sortProfessionOverviewWorkRows(
  rows: ProfessionOverviewWorkRow[]
): ProfessionOverviewWorkRow[] {
  return [...rows].sort((left, right) => {
    if (left.sortRank !== right.sortRank) {
      return left.sortRank - right.sortRank;
    }

    const nameCompare = left.character.name.localeCompare(
      right.character.name
    );

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.profession.name.localeCompare(
      right.profession.name
    );
  });
}

export function buildProfessionOverviewWorkSummary(input: {
  rows: ProfessionOverviewWorkRow[];
  craftingCoverage: {
    covered: number;
    total: number;
  };
}): ProfessionOverviewWorkSummary {
  const characterIds = new Set<string>();

  let weeklyAttentionCount = 0;
  let permanentAttentionCount = 0;

  for (const row of input.rows) {
    characterIds.add(row.character.id);

    if (row.attention.weekly) {
      weeklyAttentionCount += 1;
    }

    if (row.attention.permanent) {
      permanentAttentionCount += 1;
    }
  }

  return {
    professionCharacterCount: characterIds.size,
    weeklyAttentionCount,
    permanentAttentionCount,
    craftingCoverage: input.craftingCoverage
  };
}

export function rowNeedsAttention(
  row: ProfessionOverviewWorkRow
): boolean {
  return (
    row.attention.weekly ||
    row.attention.permanent ||
    (row.knowledgePoints.available ?? 0) > 0
  );
}
