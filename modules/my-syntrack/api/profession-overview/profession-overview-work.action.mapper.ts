import type { ProfessionKnowledgeTreasureAggregate } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import type {
  ProfessionOverviewWorkSource,
  ProfessionOverviewWorkTreasures,
  ProfessionWorkWeeklyState
} from "./profession-overview-work.types.js";

export function mapTreasures(
  aggregate: ProfessionKnowledgeTreasureAggregate | null
): ProfessionOverviewWorkTreasures {
  if (!aggregate || aggregate.applicableTotal === 0) {
    return {
      state: "NOT_APPLICABLE",
      label: "—",
      aggregate: null
    };
  }

  const fraction = `${aggregate.completeCount}/${aggregate.applicableTotal}`;

  if (aggregate.incompleteCount > 0) {
    return {
      state: "INCOMPLETE",
      label: fraction,
      aggregate
    };
  }

  if (aggregate.unknownCount > 0) {
    return {
      state: "UNKNOWN",
      label: "?",
      aggregate
    };
  }

  return {
    state: "COMPLETE",
    label: fraction,
    aggregate
  };
}

export function deriveProfessionNextAction(input: {
  quest: ProfessionOverviewWorkSource;
  treatise: ProfessionOverviewWorkSource;
  drops: ProfessionOverviewWorkSource;
  treasures: ProfessionOverviewWorkTreasures;
  knowledgePoints: number | null;
  weeklyState: ProfessionWorkWeeklyState;
}): string | null {
  if (input.treatise.state === "INCOMPLETE") {
    return "Use Treatise";
  }

  if (input.quest.state === "INCOMPLETE") {
    return "Complete weekly quest";
  }

  if (input.drops.state === "INCOMPLETE") {
    const source = input.drops.source;

    if (
      source &&
      source.currentValue !== null &&
      source.maxValue !== null
    ) {
      const remaining =
        source.maxValue - source.currentValue;

      if (remaining > 0) {
        return `${remaining} Knowledge Drop${
          remaining === 1 ? "" : "s"
        } remaining`;
      }
    }

    return "Knowledge Drops remaining";
  }

  if (input.treasures.state === "INCOMPLETE") {
    const missing =
      input.treasures.aggregate?.incompleteCount ?? 0;

    if (missing === 1) {
      return "1 Knowledge Treasure missing";
    }

    return `${missing} Knowledge Treasures missing`;
  }

  if ((input.knowledgePoints ?? 0) > 0) {
    return `${input.knowledgePoints} KP unspent`;
  }

  if (input.weeklyState === "COMPLETE") {
    return "Weekly complete";
  }

  return null;
}

export function deriveProfessionSortRank(input: {
  weeklyState: ProfessionWorkWeeklyState;
  treasures: ProfessionOverviewWorkTreasures;
  knowledgePoints: number | null;
}): number {
  if (input.weeklyState === "ATTENTION") {
    return 0;
  }

  if (input.treasures.state === "INCOMPLETE") {
    return 1;
  }

  if ((input.knowledgePoints ?? 0) > 0) {
    return 2;
  }

  if (
    input.weeklyState === "UNKNOWN" ||
    input.treasures.state === "UNKNOWN"
  ) {
    return 3;
  }

  return 4;
}
