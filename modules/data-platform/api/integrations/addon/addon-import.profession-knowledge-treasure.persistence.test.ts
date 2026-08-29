import { describe, expect, it } from "vitest";
import { AddonProfessionKnowledgeTreasurePersistence } from "./addon-import.profession-knowledge-treasure.persistence.js";
import {
  createTransaction,
  result,
  snapshot,
  source,
  treasureDefinition
} from "./addon-import.profession-knowledge-treasure.persistence.test-helpers.js";

describe("AddonProfessionKnowledgeTreasurePersistence", () => {
  it("derives COMPLETE when the quest flag is true", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
      listEnabledForActiveSeason: async () => [
        treasureDefinition()
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
            sources: [source({ flaggedCompleted: true })]
          }
        ]
      }),
      result()
    );

    expect(
      rows.get("char-1:def-alchemy-treasure-1")?.state
    ).toBe("COMPLETE");
  });

  it("derives INCOMPLETE when the quest flag is false", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
      listEnabledForActiveSeason: async () => [
        treasureDefinition()
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
            sources: [source({ flaggedCompleted: false })]
          }
        ]
      }),
      result()
    );

    expect(
      rows.get("char-1:def-alchemy-treasure-1")?.state
    ).toBe("INCOMPLETE");
  });

  it("derives UNKNOWN when the flag was never resolved", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
      listEnabledForActiveSeason: async () => [
        treasureDefinition()
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
            sources: [source({ flaggedCompleted: null })]
          }
        ]
      }),
      result()
    );

    expect(
      rows.get("char-1:def-alchemy-treasure-1")?.state
    ).toBe("UNKNOWN");
  });

  it("never regresses an already-COMPLETE treasure back to UNKNOWN on a later unresolved capture", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
      listEnabledForActiveSeason: async () => [
        treasureDefinition()
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
            sources: [source({ flaggedCompleted: true })]
          }
        ]
      }),
      result()
    );

    expect(
      rows.get("char-1:def-alchemy-treasure-1")?.state
    ).toBe("COMPLETE");

    // A later capture where the API failed to resolve the flag must
    // not overwrite the already-proven permanent COMPLETE state.
    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        capturedAt: "2026-08-29T12:00:00.000Z",
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [source({ flaggedCompleted: null })]
          }
        ]
      }),
      result()
    );

    expect(
      rows.get("char-1:def-alchemy-treasure-1")?.state
    ).toBe("COMPLETE");
  });

  it("never regresses an already-COMPLETE treasure back to INCOMPLETE on a later capture", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
      listEnabledForActiveSeason: async () => [
        treasureDefinition()
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
        professions: [
          {
            professionName: "Alchemy",
            professionKey: "alchemy",
            sources: [source({ flaggedCompleted: false })]
          }
        ]
      }),
      result()
    );

    expect(
      rows.get("char-1:def-alchemy-treasure-1")?.state
    ).toBe("COMPLETE");
  });

  it("allows INCOMPLETE to become COMPLETE on a later capture (real progress)", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
      listEnabledForActiveSeason: async () => [
        treasureDefinition()
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
            sources: [source({ flaggedCompleted: false })]
          }
        ]
      }),
      result()
    );

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
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

    expect(
      rows.get("char-1:def-alchemy-treasure-1")?.state
    ).toBe("COMPLETE");
  });

  it("ignores a captured source with no matching enabled definition", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
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
    expect(trackResult.professionKnowledgeTreasureSnapshots).toBe(0);
  });

  it("does nothing when the character has no knowledgeTreasures module", async () => {
    const { rows, transaction } = createTransaction();
    const persistence = new AddonProfessionKnowledgeTreasurePersistence({
      listEnabledForActiveSeason: async () => {
        throw new Error(
          "should not be called when knowledgeTreasures is null"
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
