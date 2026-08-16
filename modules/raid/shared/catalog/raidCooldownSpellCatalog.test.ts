import { describe, expect, it } from "vitest";
import {
  getSpellById,
  getSpellsForCharacter,
  getSpellsForClass,
  raidCooldownSpellCatalog
} from "./raidCooldownSpellCatalog.js";

describe("getSpellsForClass", () => {
  it("returns only spells for the given class", () => {
    const spells = getSpellsForClass("Paladin");

    expect(spells.length).toBeGreaterThan(0);
    expect(
      spells.every(
        (spell) => spell.className === "Paladin"
      )
    ).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(
      getSpellsForClass("paladin").length
    ).toBe(
      getSpellsForClass("Paladin").length
    );
  });

  it("returns an empty array for an unknown class", () => {
    expect(
      getSpellsForClass("Not A Class")
    ).toEqual([]);
  });
});

describe("getSpellById", () => {
  it("resolves a known spell", () => {
    const spell = getSpellById(31821);

    expect(spell?.name).toBe("Aura Mastery");
  });

  it("returns null for an unknown id", () => {
    expect(getSpellById(0)).toBeNull();
  });
});

describe("raidCooldownSpellCatalog", () => {
  it("has no fabricated base cooldown values", () => {
    expect(
      raidCooldownSpellCatalog.every(
        (spell) =>
          spell.baseCooldownSeconds === null
      )
    ).toBe(true);
  });

  it("has real icon URLs for every entry", () => {
    expect(
      raidCooldownSpellCatalog.every((spell) =>
        spell.icon.startsWith(
          "https://render.worldofwarcraft.com/"
        )
      )
    ).toBe(true);
  });

  it("covers all 13 WoW classes", () => {
    const classes = new Set(
      raidCooldownSpellCatalog.map(
        (spell) => spell.className
      )
    );

    expect(classes.size).toBe(13);
  });

  it("has both class-wide and spec-specific entries — never fabricates a restriction", () => {
    const classWide = raidCooldownSpellCatalog.filter(
      (spell) => spell.specIds === null
    );

    const specSpecific = raidCooldownSpellCatalog.filter(
      (spell) => spell.specIds !== null
    );

    expect(classWide.length).toBeGreaterThan(0);
    expect(specSpecific.length).toBeGreaterThan(0);
  });
});

describe("getSpellsForCharacter", () => {
  it("includes class-wide Paladin spells for any real spec", () => {
    const holySpells = getSpellsForCharacter({
      className: "Paladin",
      specId: 65
    });

    const retSpells = getSpellsForCharacter({
      className: "Paladin",
      specId: 70
    });

    expect(
      holySpells.some(
        (spell) => spell.name === "Blessing of Protection"
      )
    ).toBe(true);

    expect(
      retSpells.some(
        (spell) => spell.name === "Blessing of Protection"
      )
    ).toBe(true);
  });

  it("includes a spec-specific spell only for its own spec", () => {
    const holySpells = getSpellsForCharacter({
      className: "Paladin",
      specId: 65
    });

    const retSpells = getSpellsForCharacter({
      className: "Paladin",
      specId: 70
    });

    expect(
      holySpells.some(
        (spell) => spell.name === "Aura Mastery"
      )
    ).toBe(true);

    expect(
      retSpells.some(
        (spell) => spell.name === "Aura Mastery"
      )
    ).toBe(false);
  });

  it("returns only class-wide spells for an UNKNOWN (null) spec — never zero, never a guess", () => {
    const spells = getSpellsForCharacter({
      className: "Paladin",
      specId: null
    });

    expect(spells.length).toBeGreaterThan(0);

    expect(
      spells.every((spell) => spell.specIds === null)
    ).toBe(true);
  });

  it("a spell shared by two specs (Guardian Spirit) appears for both", () => {
    const discSpells = getSpellsForCharacter({
      className: "Priest",
      specId: 256
    });

    const holySpells = getSpellsForCharacter({
      className: "Priest",
      specId: 257
    });

    expect(
      discSpells.some(
        (spell) => spell.name === "Guardian Spirit"
      )
    ).toBe(true);

    expect(
      holySpells.some(
        (spell) => spell.name === "Guardian Spirit"
      )
    ).toBe(true);
  });
});
