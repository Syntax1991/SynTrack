import { describe, expect, it } from "vitest";
import { normalizeSeasonEvidenceSnapshot } from "./addon-import.season-evidence.normalizer.js";

describe("normalizeSeasonEvidenceSnapshot", () => {
  it("normalizes split achievement facts without coercing unknown", () => {
    const snapshot = normalizeSeasonEvidenceSnapshot({
      schemaVersion: 2,
      capturedAt: 1_756_382_400,
      data: {
        achievements: {
          ["season-achievement-62872"]: {
            achievementId: 62872,
            accountCompleted: true,
            earnedByCharacter: false
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
      snapshot?.achievements["season-achievement-62872"]
    ).toMatchObject({
      accountCompleted: true,
      earnedByCharacter: false
    });
    expect(
      snapshot?.achievements["season-achievement-63650"]?.accountCompleted
    ).toBeNull();
    expect(
      snapshot?.achievements["season-achievement-63650"]?.earnedByCharacter
    ).toBeNull();
    expect(
      snapshot?.quests["season-quest-cracked-keystone"]?.flaggedCompleted
    ).toBe(false);
  });

  it("rejects schemaVersion 1 and other unsupported schemas", () => {
    expect(
      normalizeSeasonEvidenceSnapshot({
        schemaVersion: 1,
        data: {
          achievements: {
            ["season-achievement-62872"]: {
              achievementId: 62872,
              completed: true
            }
          }
        }
      })
    ).toBeNull();
    expect(
      normalizeSeasonEvidenceSnapshot({ schemaVersion: 3, data: {} })
    ).toBeNull();
  });
});
