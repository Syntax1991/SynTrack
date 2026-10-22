import { afterEach, describe, expect, it, vi } from "vitest";
import type { BattleNetAppTokenService } from "./battlenet-app-token.service.js";
import { BattleNetJournalService } from "./battlenet-journal.service.js";

vi.mock("../../../../../apps/api/src/config/env.js", () => ({
  env: {
    BATTLENET_REGION: "eu",
    // A German site locale must not leak into Journal names.
    BATTLENET_LOCALE: "de_DE"
  }
}));

const appToken = {
  getAccessToken: vi.fn(async () => "test-app-token")
} as unknown as BattleNetAppTokenService;

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(routes: Record<string, unknown>) {
  const requested: URL[] = [];

  vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    requested.push(url);
    const body = routes[url.pathname];

    return body === undefined
      ? new Response("{}", { status: 404 })
      : new Response(JSON.stringify(body), { status: 200 });
  }));

  return requested;
}

describe("BattleNetJournalService", () => {
  it("always requests English Journal names, whatever BATTLENET_LOCALE is", async () => {
    const requested = stubFetch({
      "/data/wow/journal-expansion/505": {
        raids: [{ id: 1320, name: "The Venomous Abyss" }],
        dungeons: [{ id: 1322, name: "Altar of Fangs" }]
      }
    });

    const instances = await new BattleNetJournalService(appToken).listCurrentSeasonInstances();

    expect(instances).toEqual([
      { id: 1320, name: "The Venomous Abyss", kind: "RAID" },
      { id: 1322, name: "Altar of Fangs", kind: "DUNGEON" }
    ]);
    expect(requested[0]?.searchParams.get("locale")).toBe("en_US");
    expect(requested[0]?.searchParams.get("namespace")).toBe("static-eu");
  });

  it("returns boss loot with English slot names and icons, and keeps items whose details fail", async () => {
    const requested = stubFetch({
      "/data/wow/journal-encounter/2895": {
        items: [
          { id: 1, item: { id: 270175, name: "Voracious Heart of Ula'tek" } },
          { id: 2, item: { id: 999999, name: "Unlookupable Item" } }
        ]
      },
      "/data/wow/item/270175": {
        inventory_type: { name: "Trinket" },
        quality: { type: "EPIC" }
      }
    });

    const icons = {
      resolveItemIconUrl: vi.fn(async (itemId: number) => (itemId === 270175 ? "https://render.example/heart.jpg" : null))
    };

    const loot = await new BattleNetJournalService(appToken, icons).listEncounterLoot(2895);

    expect(loot).toEqual([
      { id: 270175, name: "Voracious Heart of Ula'tek", slot: "Trinket", quality: "EPIC", iconUrl: "https://render.example/heart.jpg" },
      { id: 999999, name: "Unlookupable Item", slot: null, quality: null, iconUrl: null }
    ]);
    expect(requested.every((url) => url.searchParams.get("locale") === "en_US")).toBe(true);
  });

  it("returns null for an unknown encounter instead of throwing", async () => {
    stubFetch({});

    expect(await new BattleNetJournalService(appToken).listEncounterLoot(1)).toBeNull();
  });
});
