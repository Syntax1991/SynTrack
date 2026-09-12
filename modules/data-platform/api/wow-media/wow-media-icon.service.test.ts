import { describe, expect, it, vi } from "vitest";
import { WowMediaIconService } from "./wow-media-icon.service.js";

describe("WowMediaIconService", () => {
  it("keys class icons by canonical English name and profession icons by catalog key", async () => {
    const mediaService = {
      resolvePlayableClassIconUrl: vi.fn(async (classId: number) =>
        classId === 7
          ? "https://render.worldofwarcraft.com/icons/56/classicon_shaman.jpg"
          : null
      ),
      resolveProfessionIconUrl: vi.fn(async (professionId: number) =>
        professionId === 171
          ? "https://render.worldofwarcraft.com/icons/56/trade_alchemy.jpg"
          : null
      )
    };

    const service = new WowMediaIconService(mediaService as never);
    const icons = await service.getIcons();

    expect(icons.classes.Shaman).toBe(
      "https://render.worldofwarcraft.com/icons/56/classicon_shaman.jpg"
    );
    expect(icons.classes.Warrior).toBeNull();
    expect(icons.professions.alchemy).toBe(
      "https://render.worldofwarcraft.com/icons/56/trade_alchemy.jpg"
    );
    expect(icons.professions.blacksmithing).toBeNull();
    expect(icons.classes.Schamane).toBeUndefined();
    expect(icons.professions.Alchemy).toBeUndefined();
  });

  it("reuses the first resolved map instead of calling Battle.net again", async () => {
    const mediaService = {
      resolvePlayableClassIconUrl: vi.fn(async () => null),
      resolveProfessionIconUrl: vi.fn(async () => null)
    };

    const service = new WowMediaIconService(mediaService as never);

    await service.getIcons();
    await service.getIcons();

    expect(mediaService.resolvePlayableClassIconUrl).toHaveBeenCalledTimes(13);
    expect(mediaService.resolveProfessionIconUrl).toHaveBeenCalledTimes(11);
  });
});
