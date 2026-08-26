import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleNetItemService } from "./battlenet-item.service.js";

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

describe("BattleNetItemService", () => {
  it("resolves Blizzard's exact Epic quality for an item, by itemId only", async () => {
    const fetchMock = vi.fn(
      async (
        url: string | URL
      ) => {
        expect(
          String(url)
        ).toContain(
          "/data/wow/item/244589"
        );

        return new Response(
          JSON.stringify({
            quality: {
              type: "EPIC",
              name: "Epic"
            },
            level: 220
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
      new BattleNetItemService(
        createAppTokenService() as never
      );

    const details =
      await service.resolveItemDetails(
        244589
      );

    expect(details).toEqual({
      quality: "EPIC",
      level: 220
    });
  });

  it("resolves Blizzard's exact Rare quality for a different item, never confused with Epic", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              quality: {
                type: "RARE",
                name: "Rare"
              },
              level: 200
            }),
            { status: 200 }
          )
      )
    );

    const service =
      new BattleNetItemService(
        createAppTokenService() as never
      );

    const details =
      await service.resolveItemDetails(
        244584
      );

    expect(
      details?.quality
    ).toBe("RARE");

    expect(
      details?.quality
    ).not.toBe("EPIC");
  });

  it("returns a fully null result, not a guess, when the response has no quality field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({}),
            { status: 200 }
          )
      )
    );

    const service =
      new BattleNetItemService(
        createAppTokenService() as never
      );

    expect(
      await service.resolveItemDetails(
        1
      )
    ).toEqual({
      quality: null,
      level: null
    });
  });

  it("returns null when Blizzard responds with a non-ok status", async () => {
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
      new BattleNetItemService(
        createAppTokenService() as never
      );

    expect(
      await service.resolveItemDetails(
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
      new BattleNetItemService(
        createAppTokenService() as never
      );

    expect(
      await service.resolveItemDetails(
        1
      )
    ).toBeNull();
  });
});
