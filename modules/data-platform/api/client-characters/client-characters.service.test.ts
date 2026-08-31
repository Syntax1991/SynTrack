import { describe, expect, it, vi } from "vitest";
import { ClientCharactersService } from "./client-characters.service.js";

describe("ClientCharactersService", () => {
  it("merges identity, item level, and last-capture rows by character id for one account", async () => {
    const listCharactersForAccount = vi.fn().mockResolvedValue([
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
      listCharactersForAccount,
      findItemLevels,
      findLastCapturedAt
    );

    const result = await service.listForAccount("account-a");

    expect(listCharactersForAccount).toHaveBeenCalledWith("account-a");
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
  });

  it("never fabricates itemLevel or lastSyncedAt", async () => {
    const service = new ClientCharactersService(
      vi.fn().mockResolvedValue([
        { id: "char-1", name: "Fresh Alt", realm: "Antonidas", className: "Warrior", level: 10 }
      ]),
      vi.fn().mockResolvedValue(new Map()),
      vi.fn().mockResolvedValue(new Map())
    );

    const result = await service.listForAccount("account-a");

    expect(result[0]!.itemLevel).toBeNull();
    expect(result[0]!.lastSyncedAt).toBeNull();
  });

  it("returns all 22 owned characters even when most have never been recaptured", async () => {
    const rows = Array.from({ length: 22 }, (_, index) => ({
      id: `char-${index}`,
      name: `Char${index}`,
      realm: "Antonidas",
      className: "Mage",
      level: 80
    }));
    const listCharactersForAccount = vi.fn().mockResolvedValue(rows);
    const findItemLevels = vi.fn().mockResolvedValue(new Map());
    const findLastCapturedAt = vi.fn().mockResolvedValue(new Map());

    const service = new ClientCharactersService(
      listCharactersForAccount,
      findItemLevels,
      findLastCapturedAt
    );

    const result = await service.listForAccount("account-a");

    expect(listCharactersForAccount).toHaveBeenCalledWith("account-a");
    expect(result).toHaveLength(22);
    expect(result.every((row) => row.lastSyncedAt === null)).toBe(true);
  });

  it("returns an empty roster for an owned account with no characters", async () => {
    const listCharactersForAccount = vi.fn().mockResolvedValue([]);
    const findItemLevels = vi.fn().mockResolvedValue(new Map());
    const findLastCapturedAt = vi.fn().mockResolvedValue(new Map());

    const service = new ClientCharactersService(
      listCharactersForAccount,
      findItemLevels,
      findLastCapturedAt
    );

    const result = await service.listForAccount("account-a");

    expect(result).toEqual([]);
    expect(listCharactersForAccount).toHaveBeenCalledWith("account-a");
  });
});
