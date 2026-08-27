import { describe, expect, it } from "vitest";
import type { OverviewSummary } from "../types/overview.types";
import { formatOverviewSummaryText } from "./summaryText";

function buildSummary(
  overrides: Partial<OverviewSummary> = {}
): OverviewSummary {
  return {
    period: {
      key: "2026-08-26",
      startsAt:
        "2026-08-26T07:00:00.000Z",
      endsAt:
        "2026-09-02T07:00:00.000Z"
    },
    characterCount: 20,
    readyCount: 5,
    attentionCount: 3,
    weeklyProgress: {
      completed: 40,
      total: 100
    },
    vault: {
      trackedCount: 10,
      fullyUnlockedCount: 2
    },
    refreshNeededCount: 0,
    ...overrides
  };
}

const now = new Date(
  "2026-08-26T23:00:00.000Z"
);

describe("formatOverviewSummaryText", () => {
  it("omits the refresh indicator entirely when nothing needs refresh", () => {
    expect(
      formatOverviewSummaryText(
        buildSummary({
          refreshNeededCount: 0
        }),
        now
      )
    ).toBe(
      "20 characters · 3 attention · 5 ready · Reset in 6d 8h"
    );
  });

  it("appends a subtle refresh indicator when characters need refresh", () => {
    expect(
      formatOverviewSummaryText(
        buildSummary({
          refreshNeededCount: 3
        }),
        now
      )
    ).toBe(
      "20 characters · 3 attention · 5 ready · Reset in 6d 8h · 3 need refresh"
    );
  });
});
