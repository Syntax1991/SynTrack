import { describe, expect, it } from "vitest";
import {
  EFFECTIVE_ROLE_ORDER,
  computeRoleCounts,
  getSpecById,
  getSpecsForClass,
  raidSpecializationCatalog,
  resolveEffectiveRole
} from "./raidSpecializationCatalog.js";

describe("raidSpecializationCatalog", () => {
  it("has exactly 39 real specializations across all 13 classes", () => {
    expect(raidSpecializationCatalog).toHaveLength(39);
  });

  it("every entry has a unique specId", () => {
    const ids = raidSpecializationCatalog.map(
      (spec) => spec.specId
    );

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getSpecById", () => {
  it("resolves a real known spec id to its verified name/class/role", () => {
    expect(getSpecById(65)).toMatchObject({
      name: "Holy",
      className: "Paladin",
      role: "HEALER"
    });

    expect(getSpecById(70)).toMatchObject({
      name: "Retribution",
      className: "Paladin",
      role: "DPS"
    });
  });

  it("returns null for an unrecognized spec id", () => {
    expect(getSpecById(999999)).toBeNull();
  });

  it("returns null for a null spec id", () => {
    expect(getSpecById(null)).toBeNull();
  });
});

describe("getSpecsForClass", () => {
  it("returns exactly the 3 real Paladin specs", () => {
    const specs = getSpecsForClass("Paladin");

    expect(specs.map((spec) => spec.name).sort()).toEqual([
      "Holy",
      "Protection",
      "Retribution"
    ]);
  });

  it("is case-insensitive", () => {
    expect(getSpecsForClass("paladin")).toHaveLength(3);
  });

  it("returns an empty list for an unknown class", () => {
    expect(getSpecsForClass("Not A Class")).toHaveLength(0);
  });
});

describe("resolveEffectiveRole", () => {
  it("derives HEALER from Holy Paladin", () => {
    expect(resolveEffectiveRole(65)).toBe("HEALER");
  });

  it("derives DPS from Retribution Paladin", () => {
    expect(resolveEffectiveRole(70)).toBe("DPS");
  });

  it("derives TANK from Protection Paladin", () => {
    expect(resolveEffectiveRole(66)).toBe("TANK");
  });

  it("never guesses — returns UNKNOWN for a null spec, not a class-based guess", () => {
    expect(resolveEffectiveRole(null)).toBe("UNKNOWN");
  });

  it("returns UNKNOWN for an unrecognized spec id rather than crashing", () => {
    expect(resolveEffectiveRole(999999)).toBe("UNKNOWN");
  });
});

describe("computeRoleCounts", () => {
  it("counts the two-Paladin acceptance case correctly", () => {
    const counts = computeRoleCounts([65, 70]);

    expect(counts).toEqual({
      TANK: 0,
      HEALER: 1,
      DPS: 1,
      UNKNOWN: 0
    });
  });

  it("counts unknown specs without crashing", () => {
    const counts = computeRoleCounts([null, 999999]);

    expect(counts.UNKNOWN).toBe(2);
  });
});

describe("EFFECTIVE_ROLE_ORDER", () => {
  it("is the canonical TANK / HEALER / DPS / UNKNOWN order", () => {
    expect(EFFECTIVE_ROLE_ORDER).toEqual([
      "TANK",
      "HEALER",
      "DPS",
      "UNKNOWN"
    ]);
  });
});
