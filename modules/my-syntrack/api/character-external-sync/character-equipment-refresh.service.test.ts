import { describe, expect, it, vi } from "vitest";
import { CharacterEquipmentRefreshService } from "./character-equipment-refresh.service.js";
import type { RefreshableCharacter } from "./character-equipment-refresh.service.js";

function createHarness(
  characters: RefreshableCharacter[],
  options: {
    equipmentResult?: unknown;
    equipmentError?: Error;
  } = {}
) {
  const getAccessToken = vi.fn(async () => "app-token");
  const getCharacterEquipment = vi.fn(async () => {
    if (options.equipmentError) {
      throw options.equipmentError;
    }

    return "equipmentResult" in options
      ? options.equipmentResult
      : { equipped_items: [] };
  });
  const recordSuccess = vi.fn(async () => {});
  const recordFailure = vi.fn(async () => {});

  const appTokenService = { getAccessToken };
  const battleNetClient = { getCharacterEquipment };
  const snapshotRepository = { recordSuccess, recordFailure };
  const characterLookup = {
    findById: vi.fn(
      async (id: string) =>
        characters.find((character) => character.id === id) ?? null
    ),
    findAllEligible: vi.fn(async () => characters)
  };

  const service = new CharacterEquipmentRefreshService(
    appTokenService as never,
    battleNetClient as never,
    snapshotRepository as never,
    characterLookup as never
  );

  return {
    service,
    getAccessToken,
    getCharacterEquipment,
    recordSuccess,
    recordFailure
  };
}

const character: RefreshableCharacter = {
  id: "char-1",
  name: "Synblast",
  realm: "Antonidas",
  realmSlug: null
};

describe("CharacterEquipmentRefreshService", () => {
  it("fetches equipment using the app token and persists a normalized success snapshot", async () => {
    const harness = createHarness([character], {
      equipmentResult: {
        equipped_items: [
          { slot: { type: "HEAD" }, level: { value: 320 } }
        ]
      }
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(harness.getAccessToken).toHaveBeenCalledTimes(1);
    expect(harness.getCharacterEquipment).toHaveBeenCalledWith(
      "app-token",
      "antonidas",
      "Synblast"
    );
    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      slotCount: 1,
      averageItemLevel: 320
    });
    expect(harness.recordSuccess).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "EQUIPMENT",
      expect.objectContaining({ averageItemLevel: 320 })
    );
    expect(harness.recordFailure).not.toHaveBeenCalled();
  });

  it("derives the realm slug when the character has none stored", async () => {
    const harness = createHarness([
      { ...character, realm: "Die Aldor", realmSlug: null }
    ]);

    await harness.service.refreshCharacter("char-1");

    expect(harness.getCharacterEquipment).toHaveBeenCalledWith(
      "app-token",
      "die-aldor",
      "Synblast"
    );
  });

  it("returns NOT_FOUND without ever calling Blizzard for an unknown character id", async () => {
    const harness = createHarness([character]);

    const outcome = await harness.service.refreshCharacter("does-not-exist");

    expect(outcome).toEqual({
      status: "NOT_FOUND",
      characterId: "does-not-exist"
    });
    expect(harness.getAccessToken).not.toHaveBeenCalled();
  });

  it("records a failure without throwing when Blizzard's equipment call rejects (network/5xx/429)", async () => {
    const harness = createHarness([character], {
      equipmentError: new Error("Battle.net request failed (503).")
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome.status).toBe("FAILED");
    expect(harness.recordFailure).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "EQUIPMENT",
      "Battle.net request failed (503)."
    );
    expect(harness.recordSuccess).not.toHaveBeenCalled();
  });

  it("records a not_found failure, not a crash, when Blizzard returns null (character not found)", async () => {
    const harness = createHarness([character], { equipmentResult: null });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toMatchObject({ status: "FAILED", reason: "not_found" });
  });

  it("one character failing does not stop or corrupt the refresh of unrelated characters", async () => {
    const good: RefreshableCharacter = {
      id: "char-2",
      name: "Synbloom",
      realm: "Antonidas",
      realmSlug: null
    };

    const getAccessToken = vi.fn(async () => "app-token");
    const getCharacterEquipment = vi.fn(async (_token: string, _realm: string, name: string) => {
      if (name === "Synblast") {
        throw new Error("Battle.net timeout");
      }

      return { equipped_items: [{ slot: { type: "HEAD" }, level: { value: 300 } }] };
    });
    const recordSuccess = vi.fn(async () => {});
    const recordFailure = vi.fn(async () => {});

    const service = new CharacterEquipmentRefreshService(
      { getAccessToken } as never,
      { getCharacterEquipment } as never,
      { recordSuccess, recordFailure } as never,
      {
        findById: vi.fn(),
        findAllEligible: vi.fn(async () => [character, good])
      } as never
    );

    const summary = await service.refreshAllEligible();

    expect(summary.totalCharacters).toBe(2);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);
    expect(recordFailure).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "EQUIPMENT",
      "Battle.net timeout"
    );
    expect(recordSuccess).toHaveBeenCalledWith(
      "char-2",
      "BLIZZARD",
      "EQUIPMENT",
      expect.objectContaining({ averageItemLevel: 300 })
    );
  });
});
