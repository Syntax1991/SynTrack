import { describe, expect, it, vi } from "vitest";
import { ClientCharactersService } from "./client-characters.service.js";

describe("ClientCharactersService", () => {
  it("merges identity, item level, and last-capture rows by character id", async () => {
    const listCharacters = vi.fn().mockResolvedValue([
      { id: "char-1", name: "Synblast", realm: "Antonidas", className: "Mage", level: 80 },
      { id: "char-2", name: "Syndraco", realm: "Antonidas", className: "Priest", level: 80 }
    ]);

    const findItemLevels = vi.fn().mockResolvedValue(
      new Map([
        ["char-1", 312.3],
        ["char-2", null]
      ])
    );

    const capturedAt = new Date("2026-08-30T12:00:00Z");
    const findLastCapturedAt = vi.fn().mockResolvedValue(
      new Map([["char-1", capturedAt]])
    );

    const service = new ClientCharactersService(
      listCharacters,
      findItemLevels,
      findLastCapturedAt
    );

    const result = await service.list();

    expect(result).toEqual([
      {
        id: "char-1",
        name: "Synblast",
        realm: "Antonidas",
        className: "Mage",
        level: 80,
        itemLevel: 312.3,
        lastSyncedAt: capturedAt.toISOString()
      },
      {
        id: "char-2",
        name: "Syndraco",
        realm: "Antonidas",
        className: "Priest",
        level: 80,
        itemLevel: null,
        lastSyncedAt: null
      }
    ]);

    expect(findItemLevels).toHaveBeenCalledWith(["char-1", "char-2"]);
    expect(findLastCapturedAt).toHaveBeenCalledWith(["char-1", "char-2"]);
  });

  it("never fabricates itemLevel or lastSyncedAt - both stay null (UNKNOWN) rather than defaulting to 0/now", async () => {
    const listCharacters = vi.fn().mockResolvedValue([
      { id: "char-1", name: "Fresh Alt", realm: "Antonidas", className: "Warrior", level: 10 }
    ]);

    const findItemLevels = vi.fn().mockResolvedValue(new Map());
    const findLastCapturedAt = vi.fn().mockResolvedValue(new Map());

    const service = new ClientCharactersService(
      listCharacters,
      findItemLevels,
      findLastCapturedAt
    );

    const result = await service.list();

    expect(result[0]!.itemLevel).toBeNull();
    expect(result[0]!.lastSyncedAt).toBeNull();
  });

  it("returns an empty roster without calling the lookup functions when there are no characters", async () => {
    const listCharacters = vi.fn().mockResolvedValue([]);
    const findItemLevels = vi.fn().mockResolvedValue(new Map());
    const findLastCapturedAt = vi.fn().mockResolvedValue(new Map());

    const service = new ClientCharactersService(
      listCharacters,
      findItemLevels,
      findLastCapturedAt
    );

    const result = await service.list();

    expect(result).toEqual([]);
    expect(findItemLevels).toHaveBeenCalledWith([]);
    expect(findLastCapturedAt).toHaveBeenCalledWith([]);
  });
});
