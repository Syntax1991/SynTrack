import { describe, expect, it, vi } from "vitest";
import { GearReadinessService } from "./gear-readiness.service.js";

/*
 * Service-level wiring test (Phase F1 corrective review, Section 6):
 * proves the actual orchestration boundary GearReadinessService.getOverview()
 * changed in Phase F1 - that resolveEffectiveGearItem is genuinely called
 * with real authority-service output, that the stale/scaled-level policy
 * is honored end to end, and that addon tier/embellishment evidence
 * survives being merged with a real Blizzard result. This does not
 * duplicate gear-readiness.effective.test.ts's exhaustive pure-function
 * coverage - it only proves the wiring itself is correct.
 */

function characterRow() {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    gearSlots: [
      {
        id: "row-cuid-1",
        slotKey: "HEAD",
        itemId: 1000,
        itemName: "Old Addon Helm",
        itemLevel: 300,
        enchantStatus: "READY",
        enchantName: "Glorious Stats",
        socketCount: 0,
        gemCount: 0,
        notes: null,
        source: "ADDON",
        lastSyncedAt: new Date("2026-09-01T00:00:00Z"),
        updatedAt: new Date("2026-09-01T00:00:00Z"),
        setId: 2065,
        expansionId: 11,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: "[1296629,1296630]",
        uniqueCategoryId: null,
        uniqueCategoryCount: null,
        uniquenessResolved: true
      }
    ],
    gearBagSetPieces: []
  };
}

function createHarness(options: {
  blizzardItemLevel: number | null;
  blizzardLastLoginAt?: Date | null;
}) {
  const findCharacters = vi.fn(async () => [characterRow()]);
  const getAuthoritativeEquipment = vi.fn(async () => ({
    source: "BLIZZARD" as const,
    averageItemLevel: options.blizzardItemLevel,
    slots: [
      {
        slotKey: "HEAD",
        itemId: 271483,
        itemName: "Schlangenkrone des Schlangenorakels",
        itemLevel: options.blizzardItemLevel,
        hasEnchant: false,
        socketCount: 0,
        filledSocketCount: 0
      }
    ],
    fetchedAt: new Date(),
    isStale: false
  }));
  const getLastLoginAtMap = vi.fn(
    async () => new Map([["char-1", options.blizzardLastLoginAt ?? null]])
  );

  const service = new GearReadinessService(
    { findCharacters } as never,
    { getAuthoritativeEquipment } as never,
    { getLastLoginAtMap } as never
  );

  return { service, findCharacters, getAuthoritativeEquipment, getLastLoginAtMap };
}

describe("GearReadinessService.getOverview - service-level wiring", () => {
  it("actually calls the equipment authority service and reflects its result in the served HEAD slot", async () => {
    const harness = createHarness({ blizzardItemLevel: 315 });

    const overview = await harness.service.getOverview();
    const head = overview.characters[0]!.slots.find((slot) => slot.key === "HEAD");

    expect(harness.getAuthoritativeEquipment).toHaveBeenCalledWith("char-1");
    expect(head!.item).toMatchObject({
      itemId: 271483,
      itemLevel: 315,
      itemLevelSource: "BLIZZARD"
    });
  });

  it("honors the scaled-level policy: falls back to the addon's item level when Blizzard's is null (already distrusted upstream)", async () => {
    const harness = createHarness({ blizzardItemLevel: null });

    const overview = await harness.service.getOverview();
    const head = overview.characters[0]!.slots.find((slot) => slot.key === "HEAD");

    expect(head!.item).toMatchObject({
      itemId: 271483, // still Blizzard's - identity is unaffected
      itemLevel: 300, // the addon's real value
      itemLevelSource: "ADDON"
    });
  });

  it("honors the recency guard: skips Blizzard for this slot when the addon synced after Blizzard's last recorded login", async () => {
    const harness = createHarness({
      blizzardItemLevel: 315,
      blizzardLastLoginAt: new Date("2026-08-01T00:00:00Z") // before the addon's 2026-09-01 sync
    });

    const overview = await harness.service.getOverview();
    const head = overview.characters[0]!.slots.find((slot) => slot.key === "HEAD");

    expect(head!.item).toMatchObject({ itemLevel: 300, source: "ADDON" });
  });

  it("preserves addon-only tier/embellishment evidence through the full orchestration, even when Blizzard supplies the core fields", async () => {
    const harness = createHarness({ blizzardItemLevel: 315 });

    const overview = await harness.service.getOverview();
    const head = overview.characters[0]!.slots.find((slot) => slot.key === "HEAD");

    expect(head!.item).toMatchObject({
      setId: 2065,
      setBonusSpellIds: [1296629, 1296630],
      uniquenessResolved: true
    });
  });
});
