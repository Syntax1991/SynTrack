import { describe, expect, it } from "vitest";
import { normalizeSeasonEvidenceSnapshot } from "./addon-import.season-evidence.normalizer.js";

describe("normalizeSeasonEvidenceSnapshot", () => {
  it("normalizes achievement and quest evidence without coercing unknown", () => {
    const snapshot = normalizeSeasonEvidenceSnapshot({
      schemaVersion: 1,
      capturedAt: 1_756_382_400,
      data: {
        achievements: {
          ["season-achievement-62872"]: {
            achievementId: 62872,
            completed: true
          },
          ["season-achievement-63650"]: {
            achievementId: 63650
          }
        },
        quests: {
          ["season-quest-cracked-keystone"]: {
            questId: 92600,
            flaggedCompleted: false
          }
        }
      }
    });

    expect(
      snapshot?.achievements["season-achievement-62872"]?.completed
    ).toBe(true);
    expect(
      snapshot?.achievements["season-achievement-63650"]?.completed
    ).toBeNull();
    expect(
      snapshot?.quests["season-quest-cracked-keystone"]?.flaggedCompleted
    ).toBe(false);
  });

  it("rejects unsupported schemas", () => {
    expect(
      normalizeSeasonEvidenceSnapshot({ schemaVersion: 2, data: {} })
    ).toBeNull();
  });
});
