import { describe, expect, it } from "vitest";
import { AddonProfessionWeeklyPersistence } from "./addon-import.profession-weekly.persistence.js";
import {
  createTransaction,
  result,
  snapshot,
  source,
  treatiseDefinition,
  weeklyQuestDefinition
} from "./addon-import.profession-weekly.persistence.test-helpers.js";

describe("AddonProfessionWeeklyPersistence (multi-profession / period isolation)", () => {
  it("persists two professions' sources independently under the same character", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => [
        weeklyQuestDefinition({
          id: "def-alchemy-quest",
          professionKey: "alchemy"
        }),
        weeklyQuestDefinition({
          id: "def-blacksmithing-quest",
          professionKey: "blacksmithing",
          sourceKey: "weekly-quest"
        })
      ]
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [
              source({ flaggedCompleted: true })
            ]
          },
          {
            professionName: "Blacksmithing",
            professionKey: "blacksmithing",
            sources: [
              source({ flaggedCompleted: false })
            ]
          }
        ]
      }),
      result()
    );

    expect(rows.size).toBe(2);
    expect(
      rows.get("char-1:def-alchemy-quest:2026-08-26")?.state
    ).toBe("COMPLETE");
    expect(
      rows.get("char-1:def-blacksmithing-quest:2026-08-26")
        ?.state
    ).toBe("INCOMPLETE");
  });

  it("writes a distinct row per weekly period rather than overwriting a prior week", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => [
        weeklyQuestDefinition()
      ]
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        capturedAt: "2026-08-19T12:00:00.000Z",
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [source({ flaggedCompleted: true })]
          }
        ]
      }),
      result()
    );

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        capturedAt: "2026-08-28T12:00:00.000Z",
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [
              source({ flaggedCompleted: false })
            ]
          }
        ]
      }),
      result()
    );

    expect(rows.size).toBe(2);
    expect(
      rows.get(
        "char-1:def-alchemy-weekly-quest:2026-08-19"
      )?.state
    ).toBe("COMPLETE");
    expect(
      rows.get(
        "char-1:def-alchemy-weekly-quest:2026-08-26"
      )?.state
    ).toBe("INCOMPLETE");
  });

  it("keeps Treatise and Weekly Quest as independent sources for the same profession", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => [
        weeklyQuestDefinition(),
        treatiseDefinition()
      ]
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [
              source({
                sourceKey: "weekly-quest",
                flaggedCompleted: true
              }),
              source({
                sourceKey: "treatise",
                flaggedCompleted: false
              })
            ]
          }
        ]
      }),
      result()
    );

    expect(rows.size).toBe(2);
    expect(
      rows.get("char-1:def-alchemy-weekly-quest:2026-08-26")
        ?.state
    ).toBe("COMPLETE");
    expect(
      rows.get("char-1:def-alchemy-treatise:2026-08-26")
        ?.state
    ).toBe("INCOMPLETE");
  });
});
