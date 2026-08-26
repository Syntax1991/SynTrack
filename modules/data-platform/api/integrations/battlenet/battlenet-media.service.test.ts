import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleNetMediaService } from "./battlenet-media.service.js";

vi.mock(
  "../../../../../apps/api/src/config/env.js",
  () => ({
    env: {
      BATTLENET_REGION: "eu",
      BATTLENET_LOCALE: "en_GB"
    }
  })
);

function createAppTokenService() {
  return {
    getAccessToken: vi.fn(
      async () => "test-app-token"
    )
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BattleNetMediaService", () => {
  it("resolves an item's icon URL by itemId only, never by name", async () => {
    const fetchMock = vi.fn(
      async (
        url: string | URL
      ) => {
        expect(
          String(url)
        ).toContain(
          "/data/wow/media/item/123456"
        );

        return new Response(
          JSON.stringify({
            assets: [
              {
                key: "icon",
                value:
                  "https://render.worldofwarcraft.com/icons/56/inv_scouts_scaled_bracers.jpg"
              }
            ]
          }),
          { status: 200 }
        );
      }
    );

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    const service =
      new BattleNetMediaService(
        createAppTokenService() as never
      );

    const iconUrl =
      await service.resolveItemIconUrl(
        123456
      );

    expect(iconUrl).toBe(
      "https://render.worldofwarcraft.com/icons/56/inv_scouts_scaled_bracers.jpg"
    );

    expect(
      fetchMock
    ).toHaveBeenCalledTimes(1);
  });

  it("resolves a spell's icon URL by spellId, using the spell media endpoint", async () => {
    const fetchMock = vi.fn(
      async (
        url: string | URL
      ) => {
        expect(
          String(url)
        ).toContain(
          "/data/wow/media/spell/98765"
        );

        return new Response(
          JSON.stringify({
            assets: [
              {
                key: "icon",
                value:
                  "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
              }
            ]
          }),
          { status: 200 }
        );
      }
    );

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    const service =
      new BattleNetMediaService(
        createAppTokenService() as never
      );

    const iconUrl =
      await service.resolveSpellIconUrl(
        98765
      );

    expect(iconUrl).toBe(
      "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
    );
  });

  it("returns null, not a guess, when the response has no icon asset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              assets: []
            }),
            { status: 200 }
          )
      )
    );

    const service =
      new BattleNetMediaService(
        createAppTokenService() as never
      );

    expect(
      await service.resolveItemIconUrl(
        1
      )
    ).toBeNull();
  });

  it("returns null when Blizzard responds with a non-ok status (e.g. unknown id)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            null,
            { status: 404 }
          )
      )
    );

    const service =
      new BattleNetMediaService(
        createAppTokenService() as never
      );

    expect(
      await service.resolveItemIconUrl(
        999999999
      )
    ).toBeNull();
  });

  it("returns null instead of throwing when the network request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => {
          throw new Error(
            "network down"
          );
        }
      )
    );

    const service =
      new BattleNetMediaService(
        createAppTokenService() as never
      );

    expect(
      await service.resolveSpellIconUrl(
        1
      )
    ).toBeNull();
  });
});
