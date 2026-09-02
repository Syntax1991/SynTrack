import { describe, expect, it } from "vitest";
import { FakeTrackerDefinitionRepository } from "../trackers/tracker.fakes.js";
import {
  WEEKLIES_META_QUEST_TRACKER_KEY,
  WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
  WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY
} from "./weeklies-tracker-keys.js";
import { ensureWeekliesTrackerDefinitions } from "./weeklies-tracker-definitions.service.js";

describe("ensureWeekliesTrackerDefinitions", () => {
  it("creates 2K, bounty, and meta quest tracker definitions", async () => {
    const repository = new FakeTrackerDefinitionRepository();

    await ensureWeekliesTrackerDefinitions(
      "SEASON-MIDNIGHT",
      repository
    );

    const definitions = await repository.findByScope(
      "SEASON-MIDNIGHT"
    );

    expect(definitions).toHaveLength(3);
    expect(
      definitions.map((definition) => definition.key)
    ).toEqual([
      WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
      WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY,
      WEEKLIES_META_QUEST_TRACKER_KEY
    ]);

    const rating = definitions.find(
      (definition) =>
        definition.key ===
        WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY
    );
    const bounty = definitions.find(
      (definition) =>
        definition.key ===
        WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY
    );
    const meta = definitions.find(
      (definition) =>
        definition.key === WEEKLIES_META_QUEST_TRACKER_KEY
    );

    expect(rating?.valueType).toBe("NUMBER");
    expect(rating?.resetBehavior).toBe("SEASONAL");
    expect(bounty?.valueType).toBe("BOOLEAN");
    expect(bounty?.resetBehavior).toBe("WEEKLY");
    expect(meta?.valueType).toBe("BOOLEAN");
    expect(meta?.resetBehavior).toBe("WEEKLY");
  });

  it("is idempotent when definitions already exist", async () => {
    const repository = new FakeTrackerDefinitionRepository();

    await ensureWeekliesTrackerDefinitions(
      "SEASON-MIDNIGHT",
      repository
    );
    await ensureWeekliesTrackerDefinitions(
      "SEASON-MIDNIGHT",
      repository
    );

    const definitions = await repository.findByScope(
      "SEASON-MIDNIGHT"
    );

    expect(definitions).toHaveLength(3);
  });
});
