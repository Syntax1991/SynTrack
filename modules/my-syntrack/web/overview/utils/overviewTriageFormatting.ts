import type { CellToken } from "../../../../../apps/web/src/shared/types/cellToken";

type TreasureCounts = {
  completeCount: number;
  incompleteCount: number;
  unknownCount: number;
  applicableTotal: number;
};

export function formatProfessionSetupToken(setup: {
  state: string;
  professions: Array<{
    name: string;
    dataStatus: string;
    treasures: TreasureCounts;
  }>;
  dataIssues: string[];
}): CellToken {
  if (setup.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "No active profession"
    };
  }

  const lines = setup.professions.map((profession) => {
    const treasureLabel =
      profession.treasures.applicableTotal === 0
        ? "—"
        : `${profession.treasures.completeCount}/${profession.treasures.applicableTotal}`;
    return `${profession.name}: data ${profession.dataStatus}, Treasures ${treasureLabel}`;
  });

  const title =
    lines.length > 0
      ? `Profession setup\n${lines.join("\n")}`
      : "Profession setup";

  if (setup.state === "ATTENTION") {
    return {
      symbol: "!",
      tone: "attention",
      title: setup.dataIssues[0] ?? title
    };
  }

  if (setup.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title
  };
}

export function formatWeeklySummaryToken(summary: {
  state: string;
  completedKnown: number;
  applicableKnown: number;
  unknownCount: number;
  domains: Array<{
    label: string;
    state: string;
    completeCount: number;
    applicableTotal: number;
    unknownCount: number;
  }>;
}): CellToken {
  const detail = summary.domains
    .filter((domain) => domain.state !== "NOT_TRACKED")
    .map((domain) => {
      if (domain.state === "UNKNOWN") {
        return `${domain.label} ?`;
      }

      if (domain.applicableTotal <= 1 && domain.state === "READY") {
        return `${domain.label} ✓`;
      }

      return `${domain.label} ${domain.completeCount}/${domain.applicableTotal}`;
    })
    .join("\n");

  if (summary.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "No weekly state tracked"
    };
  }

  if (summary.state === "ATTENTION") {
    return {
      symbol:
        summary.applicableKnown > 0
          ? `${summary.completedKnown}/${summary.applicableKnown}`
          : "!",
      tone: "attention",
      title: detail || "Weekly work remaining"
    };
  }

  if (summary.state === "UNKNOWN") {
    return {
      symbol:
        summary.applicableKnown > 0
          ? `${summary.completedKnown}/${summary.applicableKnown} · ${summary.unknownCount}?`
          : "?",
      tone: "unknown",
      title: detail || "Weekly state unresolved"
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: detail || "All known weekly work complete"
  };
}

export function formatResourcesToken(resources: {
  state: string;
  attentionCount: number;
}): CellToken {
  if (resources.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Resources not tracked"
    };
  }

  if (resources.state === "ATTENTION" || resources.attentionCount > 0) {
    return {
      symbol: "!",
      tone: "attention",
      title: `${resources.attentionCount} resource${
        resources.attentionCount === 1 ? "" : "s"
      } need attention`
    };
  }

  if (resources.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Resource state unresolved"
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: "Resources ready"
  };
}
