import { describe, expect, it } from "vitest";
import type { ProfessionWeeklyProfessionSummary } from "../profession-weekly/profession-weekly-status.types.js";
import {
  resolveWeekliesProfessionWeeklySummary,
  weekliesProfessionSummaryTitle
} from "./weeklies-profession-summary.mapper.js";

function source(
  state: "COMPLETE" | "INCOMPLETE" | "UNKNOWN",
  sourceType:
    | "WEEKLY_QUEST"
    | "TREATISE"
    | "KNOWLEDGE_DROPS" = "WEEKLY_QUEST"
) {
  return {
    sourceKey: sourceType.toLowerCase(),
    name: sourceType,
    sourceType,
    state,
    currentValue: null,
    maxValue: null,
    capturedAt: null
  };
}

function profession(
  professionKey: string,
  name: string,
  overrides: Partial<ProfessionWeeklyProfessionSummary> = {}
): ProfessionWeeklyProfessionSummary {
  return {
    professionKey,
    name,
    quest: null,
    treatise: null,
    drops: null,
    ...overrides
  };
}

describe("resolveWeekliesProfessionWeeklySummary", () => {
  it("returns NOT_APPLICABLE when no profession weekly work exists", () => {
    const summary = resolveWeekliesProfessionWeeklySummary({
      professions: []
    });

    expect(summary).toEqual({
      state: "NOT_APPLICABLE",
      label: "—",
      openProfessionCount: 0,
      unknownProfessionCount: 0,
      path: "/professions"
    });
  });

  it("returns COMPLETE when all applicable profession weekly work is complete", () => {
    const summary = resolveWeekliesProfessionWeeklySummary({
      professions: [
        profession("alchemy", "Alchemy", {
          quest: source("COMPLETE"),
          treatise: source("COMPLETE", "TREATISE")
        })
      ]
    });

    expect(summary.state).toBe("COMPLETE");
    expect(summary.label).toBe("✓");
  });

  it("returns one open when a single profession has incomplete weekly work", () => {
    const summary = resolveWeekliesProfessionWeeklySummary({
      professions: [
        profession("alchemy", "Alchemy", {
          quest: source("INCOMPLETE"),
          treatise: source("COMPLETE", "TREATISE")
        })
      ]
    });

    expect(summary).toMatchObject({
      state: "ATTENTION",
      label: "1 open",
      openProfessionCount: 1,
      unknownProfessionCount: 0
    });
  });

  it("returns two open when two professions have incomplete weekly work", () => {
    const summary = resolveWeekliesProfessionWeeklySummary({
      professions: [
        profession("alchemy", "Alchemy", {
          quest: source("INCOMPLETE")
        }),
        profession("tailoring", "Tailoring", {
          treatise: source("INCOMPLETE", "TREATISE")
        })
      ]
    });

    expect(summary).toMatchObject({
      state: "ATTENTION",
      label: "2 open",
      openProfessionCount: 2
    });
  });

  it("returns UNKNOWN when applicable work exists but evidence is unresolved", () => {
    const summary = resolveWeekliesProfessionWeeklySummary({
      professions: [
        profession("alchemy", "Alchemy", {
          quest: source("UNKNOWN")
        })
      ]
    });

    expect(summary).toMatchObject({
      state: "UNKNOWN",
      label: "?",
      openProfessionCount: 0,
      unknownProfessionCount: 1
    });
  });

  it("prefers known open count over unresolved secondary evidence", () => {
    const summary = resolveWeekliesProfessionWeeklySummary({
      professions: [
        profession("alchemy", "Alchemy", {
          quest: source("INCOMPLETE")
        }),
        profession("tailoring", "Tailoring", {
          quest: source("UNKNOWN")
        })
      ]
    });

    expect(summary).toMatchObject({
      state: "ATTENTION",
      label: "1 open",
      openProfessionCount: 1,
      unknownProfessionCount: 1
    });
    expect(
      weekliesProfessionSummaryTitle(summary)
    ).toContain("unresolved");
  });
});
