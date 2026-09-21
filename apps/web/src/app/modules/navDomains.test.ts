import { describe, expect, it } from "vitest";
import {
  primaryNavDomains,
  manageNavDomain,
  settingsNavDomain
} from "./navDomains";

function findDomain(
  id: string
) {
  const domain =
    primaryNavDomains.find(
      (candidate) =>
        candidate.id === id
    );

  if (!domain) {
    throw new Error(
      `domain not found: ${id}`
    );
  }

  return domain;
}

describe("navDomains - flat product-domain sidebar", () => {
  it("registers exactly the five primary domains, in order, plus Settings kept separate", () => {
    expect(
      primaryNavDomains.map(
        (domain) => domain.label
      )
    ).toEqual([
      "Overview",
      "Season",
      "Characters",
      "Weeklies",
      "Professions"
    ]);

    expect(
      settingsNavDomain.label
    ).toBe("Settings");

    expect(manageNavDomain.label).toBe("Manage");
    expect(manageNavDomain.path).toBe("/manage");
    expect(manageNavDomain.isActive("/manage")).toBe(true);
    expect(manageNavDomain.isActive("/settings")).toBe(false);
  });

  it("does not register Gear as a primary product domain", () => {
    expect(
      primaryNavDomains.some(
        (domain) => domain.label === "Gear"
      )
    ).toBe(false);
    expect(
      primaryNavDomains.map((domain) => domain.id)
    ).not.toContain("gear");
  });

  it("keeps Season active on the seasonal checklist route", () => {
    const season = findDomain("season");

    expect(season.isActive("/season")).toBe(true);
    expect(season.isActive("/weekly-checklist")).toBe(false);
  });

  it("keeps Professions active across every profession sub-route, without a sidebar child route existing", () => {
    const professions =
      findDomain("professions");

    expect(
      professions.isActive(
        "/professions"
      )
    ).toBe(true);

    expect(
      professions.isActive(
        "/professions/crafters"
      )
    ).toBe(true);

    expect(
      professions.isActive(
        "/professions/specializations"
      )
    ).toBe(true);

    expect(
      professions.isActive(
        "/characters"
      )
    ).toBe(false);
  });

  it("keeps Weeklies active for both the Weekly Checklist and Vault/M+ routes, which are not sibling sidebar entries", () => {
    const weeklies =
      findDomain("weeklies");

    expect(
      weeklies.isActive(
        "/weekly-checklist"
      )
    ).toBe(true);

    expect(
      weeklies.isActive(
        "/vault-mythic-plus"
      )
    ).toBe(true);

    expect(
      weeklies.isActive(
        "/professions"
      )
    ).toBe(false);
  });

  it("keeps Overview active only on the exact root path", () => {
    const overview =
      findDomain("overview");

    expect(
      overview.isActive("/")
    ).toBe(true);

    expect(
      overview.isActive(
        "/characters"
      )
    ).toBe(false);
  });

  it("keeps Characters scoped to its own routes", () => {
    const characters =
      findDomain("characters");

    expect(
      characters.isActive(
        "/characters"
      )
    ).toBe(true);

    expect(
      characters.isActive(
        "/characters/char-1"
      )
    ).toBe(true);

    expect(
      characters.isActive("/professions")
    ).toBe(false);
  });
});
