import { describe, expect, it, vi } from "vitest";
import { RaidTaskService } from "./raid-task.service.js";

/*
 * Service-level wiring test (Phase F3): Raid Tasks was one of the real
 * direct readers of the raw Character.level/className identified by the
 * post-F2 redundancy audit - proves it now renders the effective
 * (BLIZZARD-primary/ADDON-fallback) value instead.
 */

function characterRow() {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    personalRaidTasks: []
  };
}

describe("RaidTaskService.getOverview - Phase F3 effective level/className", () => {
  it("renders the fresh Blizzard level/className", async () => {
    const findCharacters = vi.fn(async () => [characterRow()]);
    const profileAuthorityService = {
      getAuthoritativeProfile: async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 91,
        class: "Enhancement Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new RaidTaskService(
      { findCharacters } as never,
      profileAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.characters[0]).toMatchObject({
      id: "char-1",
      level: 91,
      className: "Enhancement Shaman"
    });
  });

  it("falls back to the persisted level/className when no usable Blizzard profile exists", async () => {
    const findCharacters = vi.fn(async () => [characterRow()]);
    const profileAuthorityService = {
      getAuthoritativeProfile: async () => ({
        source: "NONE" as const,
        fetchedAt: null,
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 90,
        class: "Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new RaidTaskService(
      { findCharacters } as never,
      profileAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.characters[0]).toMatchObject({
      id: "char-1",
      level: 90,
      className: "Shaman"
    });
  });
});
