import { describe, expect, it } from "vitest";
import {
  isAdminIdentity,
  parseAdminAllowlist
} from "./admin-allowlist.js";

describe("parseAdminAllowlist", () => {
  it("treats blank input as nobody is admin", () => {
    expect(parseAdminAllowlist("", "  ")).toEqual({
      accountIds: [],
      battleTags: []
    });
  });

  it("splits and trims comma-separated entries", () => {
    expect(
      parseAdminAllowlist(" 1,2 ", " Syntax#21715 , Other#1 ")
    ).toEqual({
      accountIds: ["1", "2"],
      battleTags: ["Syntax#21715", "Other#1"]
    });
  });

  it("strips quotes so BattleTags with # survive dotenv/systemd files", () => {
    expect(
      parseAdminAllowlist('"470469221"', '"Syntax#21715"')
    ).toEqual({
      accountIds: ["470469221"],
      battleTags: ["Syntax#21715"]
    });
  });
});

describe("isAdminIdentity", () => {
  const allowlist = parseAdminAllowlist(
    "blizz-1",
    "Syntax#21715"
  );

  it("matches canonical Battle.net account id", () => {
    expect(
      isAdminIdentity(
        { battleNetAccountId: "blizz-1", battleTag: "Other#9" },
        allowlist
      )
    ).toBe(true);
  });

  it("matches BattleTag case-insensitively as bootstrap fallback", () => {
    expect(
      isAdminIdentity(
        { battleNetAccountId: "other", battleTag: "syntax#21715" },
        allowlist
      )
    ).toBe(true);
  });

  it("does not match an empty allowlist", () => {
    expect(
      isAdminIdentity(
        { battleNetAccountId: "blizz-1", battleTag: "Syntax#21715" },
        parseAdminAllowlist("", "")
      )
    ).toBe(false);
  });
});
