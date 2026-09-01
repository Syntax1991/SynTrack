import { describe, expect, it } from "vitest";
import { resolveWeekliesProfessionWeeklySummary } from "./weeklies-profession-summary.mapper.js";

describe("Weeklies profession summary consistency", () => {
  it("shows 1 open when Profession Overview would show incomplete Drops", () => {
    const summary = resolveWeekliesProfessionWeeklySummary({
      professions: [
        {
          professionKey: "alchemy",
          name: "Alchemy",
          quest: {
            sourceKey: "weekly-quest",
            name: "Weekly Quest",
            sourceType: "WEEKLY_QUEST",
            state: "COMPLETE",
            currentValue: null,
            maxValue: null,
            capturedAt: null
          },
          treatise: {
            sourceKey: "treatise",
            name: "Treatise",
            sourceType: "TREATISE",
            state: "COMPLETE",
            currentValue: null,
            maxValue: null,
            capturedAt: null
          },
          drops: {
            sourceKey: "drops",
            name: "Knowledge Drops",
            sourceType: "KNOWLEDGE_DROPS",
            state: "INCOMPLETE",
            currentValue: 0,
            maxValue: 2,
            capturedAt: "2026-08-28T12:00:00.000Z"
          }
        }
      ]
    });

    expect(summary).toMatchObject({
      state: "ATTENTION",
      label: "1 open",
      openProfessionCount: 1
    });
  });
});
