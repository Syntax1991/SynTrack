import type { ProfessionWeeklyProfessionSummary } from "../profession-weekly/profession-weekly-status.types.js";

export type WeekliesProfessionSummaryState =
  | "ATTENTION"
  | "COMPLETE"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export type WeekliesProfessionWeeklySummary = {
  state: WeekliesProfessionSummaryState;
  label: string;
  openProfessionCount: number;
  unknownProfessionCount: number;
  path: "/professions";
};

type ProfessionWeeklyRollup =
  | "INCOMPLETE"
  | "UNKNOWN"
  | "COMPLETE"
  | "NOT_APPLICABLE";

function rollupProfessionWeeklyState(
  profession: ProfessionWeeklyProfessionSummary
): ProfessionWeeklyRollup {
  const sources = [
    profession.quest,
    profession.treatise,
    profession.drops
  ].filter(
    (source): source is NonNullable<typeof source> =>
      source !== null
  );

  if (sources.length === 0) {
    return "NOT_APPLICABLE";
  }

  if (sources.some((source) => source.state === "INCOMPLETE")) {
    return "INCOMPLETE";
  }

  if (sources.some((source) => source.state === "UNKNOWN")) {
    return "UNKNOWN";
  }

  return "COMPLETE";
}

export function resolveWeekliesProfessionWeeklySummary(input: {
  professions: ProfessionWeeklyProfessionSummary[];
}): WeekliesProfessionWeeklySummary {
  const path = "/professions" as const;
  let openProfessionCount = 0;
  let unknownProfessionCount = 0;
  let applicableProfessionCount = 0;

  for (const profession of input.professions) {
    const rollup = rollupProfessionWeeklyState(profession);

    if (rollup === "NOT_APPLICABLE") {
      continue;
    }

    applicableProfessionCount += 1;

    if (rollup === "INCOMPLETE") {
      openProfessionCount += 1;
    } else if (rollup === "UNKNOWN") {
      unknownProfessionCount += 1;
    }
  }

  if (applicableProfessionCount === 0) {
    return {
      state: "NOT_APPLICABLE",
      label: "—",
      openProfessionCount: 0,
      unknownProfessionCount: 0,
      path
    };
  }

  if (openProfessionCount > 0) {
    return {
      state: "ATTENTION",
      label:
        openProfessionCount === 1
          ? "1 open"
          : `${openProfessionCount} open`,
      openProfessionCount,
      unknownProfessionCount,
      path
    };
  }

  if (unknownProfessionCount > 0) {
    return {
      state: "UNKNOWN",
      label: "?",
      openProfessionCount: 0,
      unknownProfessionCount,
      path
    };
  }

  return {
    state: "COMPLETE",
    label: "✓",
    openProfessionCount: 0,
    unknownProfessionCount: 0,
    path
  };
}

export function weekliesProfessionSummaryTitle(
  summary: WeekliesProfessionWeeklySummary
): string {
  if (summary.state === "NOT_APPLICABLE") {
    return "No applicable profession weekly work";
  }

  if (summary.state === "COMPLETE") {
    return "Profession weekly work complete";
  }

  if (summary.state === "ATTENTION") {
    const parts = [
      `${summary.openProfessionCount} profession${
        summary.openProfessionCount === 1 ? "" : "s"
      } with open weekly work`
    ];

    if (summary.unknownProfessionCount > 0) {
      parts.push(
        `${summary.unknownProfessionCount} unresolved`
      );
    }

    return parts.join(" · ");
  }

  return "Profession weekly work unresolved";
}
