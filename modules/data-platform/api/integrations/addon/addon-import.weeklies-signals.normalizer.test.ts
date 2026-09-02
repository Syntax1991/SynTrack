import { describe, expect, it } from "vitest";
import { normalizeWeekliesSignalsSnapshot } from "./addon-import.weeklies-signals.normalizer.js";

describe("normalizeWeekliesSignalsSnapshot", () => {
  it("normalizes mythic plus rating and quest-flag signals", () => {
    const snapshot = normalizeWeekliesSignalsSnapshot({
      schemaVersion: 1,
      capturedAt: 1_756_382_400,
      data: {
        mythicPlusRating: {
          captured: true,
          seasonRating: 1874
        },
        troveHuntersBountyUsed: {
          signalKey: "trove-hunters-bounty-used",
          externalQuestId: 86371,
          flaggedCompleted: true
        },
        metaQuest: {
          signalKey: "meta-quest",
          externalQuestId: 95520,
          flaggedCompleted: false
        }
      }
    });

    expect(snapshot?.mythicPlusRating).toEqual({
      captured: true,
      seasonRating: 1874
    });
    expect(snapshot?.troveHuntersBountyUsed.flaggedCompleted).toBe(
      true
    );
    expect(snapshot?.metaQuest.flaggedCompleted).toBe(false);
  });
});
