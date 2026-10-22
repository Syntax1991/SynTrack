import { describe, expect, it } from "vitest";
import { BonusRollCatalogService } from "./bonus-roll-catalog.service.js";
import { sampleJournal } from "./bonus-roll.fakes.js";

describe("BonusRollCatalogService", () => {
  it("serves instances, bosses and loot from the Journal", async () => {
    const catalog = new BonusRollCatalogService(sampleJournal());

    expect((await catalog.listInstances()).map((entry) => entry.name)).toEqual(["Der Giftige Abgrund", "Altar der Fänge"]);
    expect((await catalog.listEncounters(1320)).map((entry) => entry.name)).toContain("Ula'tek");
    expect((await catalog.listLoot(1320, 2895)).map((entry) => entry.slot)).toEqual(["Einhändig", "Kopf"]);
  });

  it("caches successful lookups until the TTL expires", async () => {
    const journal = sampleJournal();
    let now = 0;
    const catalog = new BonusRollCatalogService(journal, 1000, () => now);

    await catalog.listLoot(1320, 2895);
    await catalog.listLoot(1320, 2895);
    expect(journal.calls).toEqual({ instances: 1, encounters: 1, loot: 1 });

    now = 1001;
    await catalog.listLoot(1320, 2895);
    expect(journal.calls).toEqual({ instances: 2, encounters: 2, loot: 2 });
  });

  it("does not cache a failed Blizzard lookup", async () => {
    const journal = sampleJournal();
    const catalog = new BonusRollCatalogService(journal);

    journal.failNext = true;
    await expect(catalog.listInstances()).rejects.toMatchObject({ statusCode: 502 });

    expect(await catalog.listInstances()).toHaveLength(2);
  });

  it("refuses bosses outside the instance and instances outside the season", async () => {
    const catalog = new BonusRollCatalogService(sampleJournal());

    await expect(catalog.listEncounters(4242)).rejects.toMatchObject({ statusCode: 400 });
    await expect(catalog.listLoot(1322, 2895)).rejects.toMatchObject({ statusCode: 400 });
  });
});
