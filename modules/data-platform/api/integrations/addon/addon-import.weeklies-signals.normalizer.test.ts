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
          externalQuestId: 98172,
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
    expect(snapshot?.metaQuest.evidence).toEqual([]);
  });

  it("normalizes schemaVersion 2 meta evidence and preserves false", () => {
    const snapshot = normalizeWeekliesSignalsSnapshot({
      schemaVersion: 2,
      capturedAt: 1_756_382_400,
      data: {
        mythicPlusRating: { captured: false },
        troveHuntersBountyUsed: {
          signalKey: "trove-hunters-bounty-used",
          externalQuestId: 86371,
          flaggedCompleted: false
        },
        metaQuest: {
          signalKey: "meta-quest",
          externalQuestId: 93911,
          flaggedCompleted: true,
          evidence: {
            ["93911"]: true,
            ["98172"]: false
          }
        }
      }
    });

    expect(snapshot?.schemaVersion).toBe(2);
    expect(snapshot?.metaQuest.flaggedCompleted).toBe(true);
    expect(snapshot?.metaQuest.evidence).toEqual(
      expect.arrayContaining([
        { questId: 93911, flaggedCompleted: true },
        { questId: 98172, flaggedCompleted: false }
      ])
    );
  });
});
