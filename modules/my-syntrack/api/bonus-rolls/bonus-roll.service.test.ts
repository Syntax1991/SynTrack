import { describe, expect, it } from "vitest";
import { BonusRollCatalogService } from "./bonus-roll-catalog.service.js";
import { FakeBonusRollRepository, sampleJournal } from "./bonus-roll.fakes.js";
import { BonusRollService } from "./bonus-roll.service.js";
import { bonusRollResultSchema } from "./bonus-roll.validation.js";

const character = { id: "char-1", name: "Syntax", realm: "Blackrock", className: "Mage" };

function build() {
  const journal = sampleJournal();
  const repository = new FakeBonusRollRepository([character]);
  const service = new BonusRollService(
    repository,
    new BonusRollCatalogService(journal),
    () => new Date("2026-10-22T20:00:00.000Z")
  );

  return { journal, repository, service };
}

describe("BonusRollService", () => {
  it("plans a roll with names taken from the Journal, not the client", async () => {
    const { service } = build();

    const view = await service.create({
      characterId: "char-1",
      instanceId: 1320,
      encounterId: 2895,
      targetItemId: 900002,
      note: "for BiS helm"
    });

    expect(view).toMatchObject({
      character,
      instance: { id: 1320, name: "The Venomous Abyss" },
      encounter: { id: 2895, name: "Ula'tek" },
      targetItem: { id: 900002, name: "Venomscale Helm", iconUrl: "https://render.example/helm.jpg" },
      status: "PLANNED",
      outcome: null,
      receivedItem: null,
      gotTarget: false,
      note: "for BiS helm",
      rolledAt: null
    });
  });

  it("plans a roll without a target item", async () => {
    const { service } = build();

    const view = await service.create({ characterId: "char-1", instanceId: 1320, encounterId: 2888 });

    expect(view.targetItem).toBeNull();
  });

  it("rejects an unknown character, a non-season instance, a foreign boss and foreign loot", async () => {
    const { service } = build();

    await expect(service.create({ characterId: "nope", instanceId: 1320, encounterId: 2895 }))
      .rejects.toMatchObject({ statusCode: 404 });
    await expect(service.create({ characterId: "char-1", instanceId: 9999, encounterId: 2895 }))
      .rejects.toMatchObject({ statusCode: 400 });
    await expect(service.create({ characterId: "char-1", instanceId: 1322, encounterId: 2895 }))
      .rejects.toMatchObject({ statusCode: 400 });
    await expect(service.create({ characterId: "char-1", instanceId: 1320, encounterId: 2895, targetItemId: 900010 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("records what the character received and flags the target", async () => {
    const { service } = build();
    const planned = await service.create({ characterId: "char-1", instanceId: 1320, encounterId: 2895, targetItemId: 900002 });

    const hit = await service.recordResult(planned.id, { outcome: "ITEM", receivedItemId: 900002 });

    expect(hit).toMatchObject({
      status: "ROLLED",
      outcome: "ITEM",
      receivedItem: { id: 900002, name: "Venomscale Helm", iconUrl: "https://render.example/helm.jpg" },
      gotTarget: true,
      rolledAt: "2026-10-22T20:00:00.000Z"
    });

    const other = await service.recordResult(planned.id, { outcome: "ITEM", receivedItemId: 900001 });
    expect(other.gotTarget).toBe(false);
    expect(other.receivedItem?.name).toBe("Fang of the Abyss");
  });

  it("records a gold-only roll without an item and can reset it to planned", async () => {
    const { service } = build();
    const planned = await service.create({ characterId: "char-1", instanceId: 1320, encounterId: 2895 });

    const gold = await service.recordResult(planned.id, {
      outcome: "NO_ITEM",
      receivedItemId: 900001,
      rolledAt: new Date("2026-10-21T19:30:00.000Z")
    });

    expect(gold).toMatchObject({ status: "ROLLED", outcome: "NO_ITEM", receivedItem: null, rolledAt: "2026-10-21T19:30:00.000Z" });

    const reset = await service.clearResult(planned.id);
    expect(reset).toMatchObject({ status: "PLANNED", outcome: null, receivedItem: null, rolledAt: null });
  });

  it("rejects a received item that is not in the boss loot table", async () => {
    const { service } = build();
    const planned = await service.create({ characterId: "char-1", instanceId: 1320, encounterId: 2895 });

    await expect(service.recordResult(planned.id, { outcome: "ITEM", receivedItemId: 900010 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("changes or clears the target and the note, and deletes rolls", async () => {
    const { service, repository } = build();
    const planned = await service.create({ characterId: "char-1", instanceId: 1320, encounterId: 2895, targetItemId: 900001 });

    const updated = await service.update(planned.id, { targetItemId: 900002, note: null });
    expect(updated.targetItem?.name).toBe("Venomscale Helm");
    expect(updated.note).toBeNull();

    expect((await service.update(planned.id, { targetItemId: null })).targetItem).toBeNull();

    await service.delete(planned.id);
    expect(repository.rows).toHaveLength(0);
    await expect(service.delete(planned.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("bonusRollResultSchema", () => {
  it("requires the received item for an ITEM outcome", () => {
    expect(bonusRollResultSchema.safeParse({ outcome: "ITEM" }).success).toBe(false);
    expect(bonusRollResultSchema.safeParse({ outcome: "ITEM", receivedItemId: 5 }).success).toBe(true);
    expect(bonusRollResultSchema.safeParse({ outcome: "NO_ITEM" }).success).toBe(true);
    expect(bonusRollResultSchema.safeParse({ outcome: "MAYBE" }).success).toBe(false);
  });
});
