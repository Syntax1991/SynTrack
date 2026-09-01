import type { CellToken } from "../../../../../apps/web/src/shared/types/cellToken";
import type {
  ProfessionOverviewWorkRow,
  ProfessionOverviewWorkSource,
  ProfessionOverviewWorkTreasures
} from "../types/professionOverviewWork.types";

function weeklySourceToken(
  source: ProfessionOverviewWorkSource
): CellToken {
  if (source.state === "NOT_APPLICABLE") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Not applicable"
    };
  }

  if (source.state === "COMPLETE") {
    return {
      symbol: "✓",
      tone: "ready",
      title: "Complete this week"
    };
  }

  if (source.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title: "No evidence captured yet"
    };
  }

  return {
    symbol: source.label ?? "!",
    tone: "attention",
    title: "Not complete this week"
  };
}

function treasureToken(
  treasures: ProfessionOverviewWorkTreasures
): CellToken {
  if (treasures.state === "NOT_APPLICABLE") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Not applicable"
    };
  }

  if (treasures.state === "COMPLETE") {
    return {
      symbol: treasures.label ?? "✓",
      tone: "ready",
      title: "All knowledge treasures complete"
    };
  }

  if (treasures.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Treasure evidence unresolved"
    };
  }

  return {
    symbol: treasures.label ?? "!",
    tone: "attention",
    title: "Knowledge treasures missing"
  };
}

export function weeklySummaryToken(
  row: ProfessionOverviewWorkRow
): CellToken {
  if (row.weekly.state === "NOT_APPLICABLE") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "No weekly sources tracked"
    };
  }

  if (row.weekly.state === "COMPLETE") {
    return {
      symbol: "✓",
      tone: "ready",
      title: "Weekly complete"
    };
  }

  if (row.weekly.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Weekly evidence unresolved"
    };
  }

  return {
    symbol: row.weekly.summary,
    tone: "attention",
    title: row.weekly.summary
  };
}

export function professionWorkNeedsAttention(
  row: ProfessionOverviewWorkRow
): boolean {
  return (
    row.attention.weekly ||
    row.attention.permanent ||
    (row.knowledgePoints.available ?? 0) > 0
  );
}

export {
  weeklySourceToken,
  treasureToken
};
