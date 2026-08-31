import { describe, expect, it } from "vitest";
import {
  buildBattleNetCharacterKey,
  buildNameRealmCharacterKey,
  buildStableCharacterKey,
  buildSuppressionLookupKeys
} from "./character-identity.js";

describe("character-identity", () => {
  it("builds realm-safe name keys and never uses name alone", () => {
    expect(
      buildNameRealmCharacterKey({
        name: "Synblast",
        realm: "Antonidas",
        region: "EU"
      })
    ).toBe("nr:eu:antonidas:synblast");

    expect(
      buildNameRealmCharacterKey({
        name: "Synblast",
        realm: "Blackhand",
        region: "eu"
      })
    ).toBe("nr:eu:blackhand:synblast");

    expect(
      buildNameRealmCharacterKey({
        name: "Synblast",
        realm: "Antonidas",
        region: "eu"
      })
    ).not.toBe(
      buildNameRealmCharacterKey({
        name: "Synblast",
        realm: "Blackhand",
        region: "eu"
      })
    );
  });

  it("prefers battleNetId for stable key when present", () => {
    expect(
      buildStableCharacterKey({
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        battleNetId: "12345"
      })
    ).toBe(buildBattleNetCharacterKey("eu", "12345"));

    expect(
      buildSuppressionLookupKeys({
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        battleNetId: "12345"
      })
    ).toEqual([
      "nr:eu:antonidas:synblast",
      "bn:eu:12345"
    ]);
  });
});
