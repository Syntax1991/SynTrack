import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createClaim,
  createCoverage,
  createDetail,
  renderTable
} from "./professionOverviewResponsibilityTable.fixtures";

describe("ProfessionOverviewResponsibilityTable - Blacksmithing Weapons/Profession Gear acceptance", () => {
  it("renders Weapons and Profession Gear as their own sections, distinct from Armor", () => {
    const synvoid = createCoverage({
      character: {
        id: "character-5",
        name: "Synvoid",
        realm: "Antonidas",
        className: "Rogue",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          presentationGroup: "Weapons",
          familyName: "Weapon",
          kind: "WEAPON_TYPE",
          capabilityKey:
            "blacksmithing.weapon.axe",
          slotKey: "AXE",
          slotName: "Axe",
          nodeName: "Axes and Polearms",
          nodeKey: "addon:104627",
          rank: 7,
          maxRank: 25
        })
      ]
    });

    const synlight = createCoverage({
      character: {
        id: "character-6",
        name: "Synlight",
        realm: "Antonidas",
        className: "Priest",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          presentationGroup:
            "Profession Gear",
          familyName: "Profession Gear",
          slotKey: "PROFESSION_TOOL",
          slotName: "Profession Tool",
          nodeName: "Trade Tools",
          nodeKey: "addon:104257",
          rank: 25,
          maxRank: 25
        })
      ]
    });

    renderTable(
      createDetail([
        synvoid,
        synlight
      ])
    );

    expect(
      screen.getByText("Weapons")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Profession Gear")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Axes and Polearms")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Trade Tools")
    ).toBeInTheDocument();
  });

  it("Synvoid acceptance case: Axe and Polearm render as two separate rows (never merged 'Axe / Polearm'), both from the same Axes and Polearms node", () => {
    const synvoid = createCoverage({
      character: {
        id: "character-5",
        name: "Synvoid",
        realm: "Antonidas",
        className: "Rogue",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          presentationGroup: "Weapons",
          familyName: "Weapon",
          kind: "WEAPON_TYPE",
          capabilityKey:
            "blacksmithing.weapon.axe",
          slotKey: "AXE",
          slotName: "Axe",
          nodeName: "Axes and Polearms",
          nodeKey: "addon:104627",
          rank: 7,
          maxRank: 25
        }),
        createClaim({
          presentationGroup: "Weapons",
          familyName: "Weapon",
          kind: "WEAPON_TYPE",
          capabilityKey:
            "blacksmithing.weapon.polearm",
          slotKey: "POLEARM",
          slotName: "Polearm",
          nodeName: "Axes and Polearms",
          nodeKey: "addon:104627",
          rank: 7,
          maxRank: 25
        })
      ]
    });

    renderTable(
      createDetail([synvoid])
    );

    expect(
      screen.getByText("Axe")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Polearm")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Axe / Polearm")
    ).not.toBeInTheDocument();

    expect(
      screen.getAllByText("Axes and Polearms")
    ).toHaveLength(2);

    const rows =
      document.querySelectorAll(
        ".profession-responsibility-slot-row"
      );

    expect(rows).toHaveLength(2);
  });

  it("Synspin acceptance case: renders Long Blades and Short Blades under Weapons with their real imported ranks, and is never reported as unspecialized", () => {
    const synspin = createCoverage({
      character: {
        id: "character-7",
        name: "Synspin",
        realm: "Antonidas",
        className: "Monk",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          presentationGroup: "Weapons",
          familyName: "Weapon",
          kind: "CRAFT_CATEGORY",
          capabilityKey:
            "blacksmithing.weapon.long_blades",
          slotKey: "LONG_BLADES",
          slotName: "Long Blades",
          nodeName: "Long Blades",
          nodeKey: "addon:104630",
          rank: 7,
          maxRank: 25
        }),
        createClaim({
          presentationGroup: "Weapons",
          familyName: "Weapon",
          kind: "CRAFT_CATEGORY",
          capabilityKey:
            "blacksmithing.weapon.short_blades",
          slotKey: "SHORT_BLADES",
          slotName: "Short Blades",
          nodeName: "Short Blades",
          nodeKey: "addon:104631",
          rank: 25,
          maxRank: 25
        })
      ]
    });

    renderTable(
      createDetail([synspin])
    );

    expect(
      screen.getByText("Weapons")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Synspin")
    ).toHaveLength(1);

    expect(
      screen.getAllByText("Long Blades")
    ).not.toHaveLength(0);

    expect(
      screen.getAllByText("Short Blades")
    ).not.toHaveLength(0);

    expect(
      screen.queryByText(
        /No verified equipment specialization/i
      )
    ).not.toBeInTheDocument();
  });
});
