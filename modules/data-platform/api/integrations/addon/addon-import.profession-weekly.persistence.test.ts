import { describe, expect, it } from "vitest";
import { AddonProfessionWeeklyPersistence } from "./addon-import.profession-weekly.persistence.js";
import {
  createTransaction,
  knowledgeDropsDefinition,
  result,
  snapshot,
  source,
  weeklyQuestDefinition
} from "./addon-import.profession-weekly.persistence.test-helpers.js";

describe("AddonProfessionWeeklyPersistence", () => {
  it("persists a completed quest-flag source as COMPLETE with raw evidence", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => [
        weeklyQuestDefinition()
      ]
    });

    const trackResult = result();

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
              })
            ]
          }
        ]
      }),
      trackResult
    );

    const row = [...rows.values()][0];

    expect(row?.state).toBe("COMPLETE");
    expect(row?.flaggedCompleted).toBe(true);
    expect(row?.externalQuestId).toBe(93528);
    expect(row?.source).toBe("ADDON");
    expect(row?.periodKey).toBe("2026-08-26");
    expect(trackResult.professionWeeklySnapshots).toBe(1);
  });

  it("persists a not-yet-completed quest-flag source as INCOMPLETE", async () => {
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
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [
              source({
                sourceKey: "weekly-quest",
                flaggedCompleted: false
              })
            ]
          }
        ]
      }),
      result()
    );

    expect([...rows.values()][0]?.state).toBe("INCOMPLETE");
  });

  it("persists UNKNOWN when the addon captured no flag evidence at all", async () => {
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
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [
              source({
                sourceKey: "weekly-quest",
                flaggedCompleted: null
              })
            ]
          }
        ]
      }),
      result()
    );

    expect([...rows.values()][0]?.state).toBe("UNKNOWN");
  });

  it("derives Knowledge Drops COMPLETE/INCOMPLETE via the same flaggedCompleted evidence as Weekly Quest/Treatise", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => [
        knowledgeDropsDefinition()
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
                sourceKey: "knowledge-drops-1",
                flaggedCompleted: false
              })
            ]
          }
        ]
      }),
      result()
    );

    expect([...rows.values()][0]?.state).toBe("INCOMPLETE");
  });

  it("derives Knowledge Drops UNKNOWN when the hidden-quest evidence is missing", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => [
        knowledgeDropsDefinition()
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
                sourceKey: "knowledge-drops-1",
                flaggedCompleted: null
              })
            ]
          }
        ]
      }),
      result()
    );

    expect([...rows.values()][0]?.state).toBe("UNKNOWN");
  });

  it("ignores a captured source with no matching enabled definition", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => []
    });

    const trackResult = result();

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [source()]
          }
        ]
      }),
      trackResult
    );

    expect(rows.size).toBe(0);
    expect(trackResult.professionWeeklySnapshots).toBe(0);
  });

  it("ignores a profession the addon could not resolve to a known professionKey", async () => {
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
        professions: [
          {
            professionName: "Some Unknown Profession",
            professionKey: null,
            sources: [source()]
          }
        ]
      }),
      result()
    );

    expect(rows.size).toBe(0);
  });

  it("does nothing when the character has no professionWeekly module", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionWeeklyPersistence({
      listEnabledForActiveSeason: async () => {
        throw new Error(
          "should not be called when professionWeekly is null"
        );
      }
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      null,
      result()
    );

    expect(rows.size).toBe(0);
  });
});
