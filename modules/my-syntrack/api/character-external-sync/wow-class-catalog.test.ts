import { describe, expect, it } from "vitest";
import {
  canonicalPlayableClassNames,
  playableClassIdForCanonicalName,
  resolveCanonicalClassName
} from "./wow-class-catalog.js";

describe("wow-class-catalog", () => {
  it("maps a stable Blizzard class id to the canonical English name", () => {
    expect(resolveCanonicalClassName(7)).toBe("Shaman");
    expect(playableClassIdForCanonicalName("Shaman")).toBe(7);
    expect(playableClassIdForCanonicalName("Schamane")).toBeNull();
  });

  it("lists every catalogued playable class once", () => {
    expect(canonicalPlayableClassNames()).toEqual([
      "Warrior",
      "Paladin",
      "Hunter",
      "Rogue",
      "Priest",
      "Death Knight",
      "Shaman",
      "Mage",
      "Warlock",
      "Monk",
      "Druid",
      "Demon Hunter",
      "Evoker"
    ]);
  });
});
