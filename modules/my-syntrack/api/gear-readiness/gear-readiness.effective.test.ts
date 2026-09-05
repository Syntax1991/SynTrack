import { describe, expect, it } from "vitest";
import type { AuthoritativeEquipmentResult } from "../character-external-sync/character-external-sync.types.js";
import { resolveEffectiveGearItem } from "./gear-readiness.effective.js";
import type { AddonGearSlotRow } from "./gear-readiness.effective.js";

function addonRow(overrides: Partial<AddonGearSlotRow> = {}): AddonGearSlotRow {
  return {
    id: "row-cuid-1",
    slotKey: "HEAD",
    itemId: 1000,
    itemName: "Old Addon Helm",
    itemLevel: 300,
    enchantStatus: "READY",
    enchantName: "Glorious Stats",
    socketCount: 1,
    gemCount: 1,
    notes: "manual note",
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
    uniquenessResolved: true,
    ...overrides
  };
}

const freshBlizzard: AuthoritativeEquipmentResult = {
  source: "BLIZZARD",
  averageItemLevel: 320,
  slots: [
    {
      slotKey: "HEAD",
      itemId: 271483,
      itemName: "Schlangenkrone des Schlangenorakels",
      itemLevel: 315,
      hasEnchant: false,
      socketCount: 0,
      filledSocketCount: 0,
      setId: 2065
    }
  ],
  fetchedAt: new Date(),
  isStale: false
};

describe("resolveEffectiveGearItem", () => {
  it("uses Blizzard core fields (itemId/name/ilvl/socket) when a fresh Blizzard snapshot covers this slot", () => {
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);

    expect(result).toMatchObject({
      id: "row-cuid-1", // the addon row's own database id - untouched by Blizzard
      itemId: 271483, // the real WoW item id, from Blizzard
      itemName: "Schlangenkrone des Schlangenorakels",
      itemLevel: 315,
      itemLevelSource: "BLIZZARD",
      source: "BLIZZARD"
    });
  });

  it("represents id as null when Blizzard covers a slot with no addon row at all", () => {
    const result = resolveEffectiveGearItem("HEAD", undefined, freshBlizzard);

    expect(result).toMatchObject({ id: null, itemId: 271483, itemLevelSource: "BLIZZARD" });
  });

  it("derives enchantStatus from Blizzard's hasEnchant + the slot catalog's supportsEnchant, never guessing a display name", () => {
    // HEAD does not support enchants at all - NOT_APPLICABLE regardless of hasEnchant.
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);
    expect(result?.enchantStatus).toBe("NOT_APPLICABLE");

    const enchantableBlizzard: AuthoritativeEquipmentResult = {
      ...freshBlizzard,
      slots: [{ slotKey: "LEGS", itemId: 1, itemName: "Legs", itemLevel: 300, hasEnchant: true, socketCount: 0, filledSocketCount: 0, setId: null }]
    };
    const legsResult = resolveEffectiveGearItem("LEGS", addonRow({ slotKey: "LEGS" }), enchantableBlizzard);
    expect(legsResult?.enchantStatus).toBe("READY");

    const missingEnchantBlizzard: AuthoritativeEquipmentResult = {
      ...freshBlizzard,
      slots: [{ slotKey: "LEGS", itemId: 1, itemName: "Legs", itemLevel: 300, hasEnchant: false, socketCount: 0, filledSocketCount: 0, setId: null }]
    };
    const missingResult = resolveEffectiveGearItem("LEGS", addonRow({ slotKey: "LEGS" }), missingEnchantBlizzard);
    expect(missingResult?.enchantStatus).toBe("MISSING");
  });

  it("preserves addon-only tier/embellishment evidence even when Blizzard is the core-field source", () => {
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);

    expect(result).toMatchObject({
      setId: 2065,
      expansionId: 11,
      setEvidenceResolved: true,
      setBonusResolved: true,
      setBonusSpellIds: [1296629, 1296630],
      uniquenessResolved: true
    });
  });

  describe("setId field-specific authority (Phase F2, live-verified equivalent)", () => {
    it("Blizzard setId wins when present, even when the addon reports a different one for the same slot", () => {
      const blizzardWithSetId: AuthoritativeEquipmentResult = {
        ...freshBlizzard,
        slots: [{ ...freshBlizzard.slots[0]!, setId: 2065 }]
      };
      const addonWithDifferentSetId = addonRow({ setId: 9999 });

      const result = resolveEffectiveGearItem("HEAD", addonWithDifferentSetId, blizzardWithSetId);

      expect(result).toMatchObject({ setId: 2065, setIdSource: "BLIZZARD" });
    });

    it("falls back to the addon's setId when Blizzard reports none for this slot", () => {
      const blizzardWithoutSetId: AuthoritativeEquipmentResult = {
        ...freshBlizzard,
        slots: [{ ...freshBlizzard.slots[0]!, setId: null }]
      };
      const addonWithSetId = addonRow({ setId: 2065 });

      const result = resolveEffectiveGearItem("HEAD", addonWithSetId, blizzardWithoutSetId);

      expect(result).toMatchObject({ setId: 2065, setIdSource: "ADDON" });
    });

    it("reports setId/setIdSource as null when neither source has one", () => {
      const blizzardWithoutSetId: AuthoritativeEquipmentResult = {
        ...freshBlizzard,
        slots: [{ ...freshBlizzard.slots[0]!, setId: null }]
      };
      const addonWithoutSetId = addonRow({ setId: null });

      const result = resolveEffectiveGearItem("HEAD", addonWithoutSetId, blizzardWithoutSetId);

      expect(result).toMatchObject({ setId: null, setIdSource: null });
    });

    it("preserves addon set-bonus evidence independently of which source wins setId", () => {
      const blizzardWithSetId: AuthoritativeEquipmentResult = {
        ...freshBlizzard,
        slots: [{ ...freshBlizzard.slots[0]!, setId: 2065 }]
      };
      const addonRowWithEvidence = addonRow({
        setId: 2065,
        setBonusResolved: true,
        setBonusSpellIds: "[1296629,1296630]",
        uniqueCategoryId: 512,
        uniqueCategoryCount: 1,
        uniquenessResolved: true
      });

      const result = resolveEffectiveGearItem("HEAD", addonRowWithEvidence, blizzardWithSetId);

      // setId came from Blizzard, but the addon's own set-bonus/uniqueness
      // evidence (unproven Blizzard equivalence - see module doc comment)
      // is preserved untouched, independently of the setId source.
      expect(result).toMatchObject({
        setId: 2065,
        setIdSource: "BLIZZARD",
        setBonusResolved: true,
        setBonusSpellIds: [1296629, 1296630],
        uniqueCategoryId: 512,
        uniqueCategoryCount: 1,
        uniquenessResolved: true
      });
    });

    it("does not bypass MANUAL precedence - a hand-entered slot's own setId always wins outright", () => {
      const blizzardWithDifferentSetId: AuthoritativeEquipmentResult = {
        ...freshBlizzard,
        slots: [{ ...freshBlizzard.slots[0]!, setId: 9999 }]
      };
      const manualRow = addonRow({ source: "MANUAL", setId: 2065 });

      const result = resolveEffectiveGearItem("HEAD", manualRow, blizzardWithDifferentSetId);

      expect(result).toMatchObject({ setId: 2065, setIdSource: "ADDON", source: "MANUAL" });
    });
  });

  it("never fabricates an enchant display name from Blizzard - keeps the addon's own enchantName", () => {
    const result = resolveEffectiveGearItem("HEAD", addonRow({ enchantName: "Glorious Stats" }), freshBlizzard);

    expect(result?.enchantName).toBe("Glorious Stats");
  });

  it("falls back to the addon row unchanged when no Blizzard snapshot exists (source=ADDON overall)", () => {
    const addonOnlyResult: AuthoritativeEquipmentResult = {
      source: "ADDON",
      averageItemLevel: 300,
      slots: [],
      fetchedAt: null,
      isStale: false
    };

    const result = resolveEffectiveGearItem("HEAD", addonRow(), addonOnlyResult);

    expect(result).toMatchObject({ id: "row-cuid-1", itemLevel: 300, itemLevelSource: "ADDON", source: "ADDON" });
  });

  it("falls back to the addon row unchanged when Blizzard has no slot for this specific key (partial coverage)", () => {
    const result = resolveEffectiveGearItem("FEET", addonRow({ slotKey: "FEET", itemLevel: 290 }), freshBlizzard);

    expect(result).toMatchObject({ itemLevel: 290, source: "ADDON" });
  });

  it("a MANUAL addon entry always wins outright, even over a fresh Blizzard snapshot", () => {
    const manualRow = addonRow({ source: "MANUAL", itemLevel: 999 });

    const result = resolveEffectiveGearItem("HEAD", manualRow, freshBlizzard);

    expect(result).toMatchObject({ itemLevel: 999, source: "MANUAL" });
  });

  it("returns null (untracked slot) when neither Blizzard nor addon has any data for this slot", () => {
    const result = resolveEffectiveGearItem("WAIST", undefined, freshBlizzard);

    expect(result).toBeNull();
  });

  describe("scaled-bracket item level (real Synbeast Timewalking evidence)", () => {
    // The authority layer already nulled `itemLevel` for a scaled item
    // (character-equipment-authority.service.ts) - this simulates that
    // decision reaching resolveEffectiveGearItem, exactly as it does for
    // Synbeast's real HEAD slot (Blizzard identity 219749 correct, but
    // its reported level 76 was a Timewalking-bracket artifact).
    const scaledBlizzard: AuthoritativeEquipmentResult = {
      source: "BLIZZARD",
      averageItemLevel: 320,
      slots: [
        {
          slotKey: "HEAD",
          itemId: 219749,
          itemName: "Charred Nerubian Helm",
          itemLevel: null, // authority layer already distrusted this
          hasEnchant: false,
          socketCount: 0,
          filledSocketCount: 0,
          setId: null
        }
      ],
      fetchedAt: new Date(),
      isStale: false
    };

    it("keeps Blizzard's item identity but falls back to the addon's item level for this field only", () => {
      const result = resolveEffectiveGearItem("HEAD", addonRow({ itemId: 219749, itemLevel: 473 }), scaledBlizzard);

      expect(result).toMatchObject({
        itemId: 219749, // still Blizzard's - the item identity is genuinely correct
        itemName: "Charred Nerubian Helm",
        itemLevel: 473, // the addon's real value, not Blizzard's scaled 76->null
        itemLevelSource: "ADDON",
        source: "BLIZZARD" // identity provenance is unaffected by the field-level fallback
      });
    });

    it("reports itemLevel null (not a fabricated 0) when Blizzard's level is scaled and no addon row exists either", () => {
      const result = resolveEffectiveGearItem("HEAD", undefined, scaledBlizzard);

      expect(result).toMatchObject({ itemId: 219749, itemLevel: null, itemLevelSource: null });
    });
  });

  it("normal (non-scaled) Blizzard equipment stays Blizzard-primary with no additional freshness gate", () => {
    // Phase F1 corrective review (2nd pass): a cross-provider recency
    // guard based on Blizzard's last_login_timestamp was removed - it
    // does not actually prove Blizzard's Equipment resource is stale
    // (see the corrective review report). No further gate exists beyond
    // the scaled-level check above, even when the addon has a very
    // recent sync of its own.
    const veryRecentAddonRow = addonRow({ lastSyncedAt: new Date() });

    const result = resolveEffectiveGearItem("HEAD", veryRecentAddonRow, freshBlizzard);

    expect(result).toMatchObject({ itemId: 271483, itemLevel: 315, source: "BLIZZARD" });
  });
});
