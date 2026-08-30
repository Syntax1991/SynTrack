import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GearTierEmbellishmentSlotInput } from "./gear-tier-embellishment.deriver.js";

describe("deriveEmbellishmentOverviewState with category configured", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("counts matching uniqueCategoryId and caps at 2", async () => {
    vi.doMock("./embellishment-category.js", () => ({
      EMBELLISHMENT_UNIQUE_CATEGORY_ID: 42
    }));

    const { deriveEmbellishmentOverviewState } = await import(
      "./gear-tier-embellishment.deriver.js"
    );

    const slots: GearTierEmbellishmentSlotInput[] = [
      {
        slotKey: "FINGER_1",
        expansionId: 10,
        setId: null,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: [],
        uniqueCategoryId: 42,
        uniquenessResolved: true
      },
      {
        slotKey: "FINGER_2",
        expansionId: 10,
        setId: null,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: [],
        uniqueCategoryId: 42,
        uniquenessResolved: true
      },
      {
        slotKey: "NECK",
        expansionId: 10,
        setId: null,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: [],
        uniqueCategoryId: 42,
        uniquenessResolved: true
      },
      {
        slotKey: "HEAD",
        expansionId: 10,
        setId: null,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: [],
        uniqueCategoryId: null,
        uniquenessResolved: true
      }
    ];

    const result = deriveEmbellishmentOverviewState({
      level: 80,
      slots
    });

    expect(result.state).toBe("READY");
    expect(result.equippedPieces).toBe(2);
    expect(result.targetPieces).toBe(2);
  });

  it("returns UNKNOWN when any equipped slot lacks uniquenessResolved", async () => {
    vi.doMock("./embellishment-category.js", () => ({
      EMBELLISHMENT_UNIQUE_CATEGORY_ID: 42
    }));

    const { deriveEmbellishmentOverviewState } = await import(
      "./gear-tier-embellishment.deriver.js"
    );

    const result = deriveEmbellishmentOverviewState({
      level: 80,
      slots: [
        {
          slotKey: "FINGER_1",
          expansionId: 10,
          setId: null,
          setEvidenceResolved: true,
          setBonusResolved: true,
          setBonusSpellIds: [],
          uniqueCategoryId: 42,
          uniquenessResolved: false
        }
      ]
    });

    expect(result.state).toBe("UNKNOWN");
  });

  it("returns proven 0/2 when category is known and no matches", async () => {
    vi.doMock("./embellishment-category.js", () => ({
      EMBELLISHMENT_UNIQUE_CATEGORY_ID: 42
    }));

    const { deriveEmbellishmentOverviewState } = await import(
      "./gear-tier-embellishment.deriver.js"
    );

    const result = deriveEmbellishmentOverviewState({
      level: 80,
      slots: [
        {
          slotKey: "HEAD",
          expansionId: 10,
          setId: null,
          setEvidenceResolved: true,
          setBonusResolved: true,
          setBonusSpellIds: [],
          uniqueCategoryId: null,
          uniquenessResolved: true
        }
      ]
    });

    expect(result.state).toBe("IN_PROGRESS");
    expect(result.equippedPieces).toBe(0);
  });
});
