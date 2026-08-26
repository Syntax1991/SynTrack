import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createClaim,
  createCoverage,
  createDetail,
  renderTable
} from "./professionOverviewResponsibilityTable.fixtures";

describe("ProfessionOverviewResponsibilityTable", () => {
  it("renders a character's identity once, followed by several child slot rows - never repeated per row", () => {
    const synblast = createCoverage({
      character: {
        id: "character-1",
        name: "Synblast",
        realm: "Antonidas",
        className: "Shaman",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          slotKey: "CHEST",
          slotName: "Chest",
          nodeName:
            "Securely Shaped",
          nodeKey: "addon:107888",
          rank: 30,
          maxRank: 30
        }),
        createClaim({
          slotKey: "SHOULDER",
          slotName: "Shoulder",
          nodeName:
            "Mighty Mantles",
          nodeKey: "addon:107885",
          rank: 5,
          maxRank: 20
        }),
        createClaim({
          slotKey: "WRIST",
          slotName: "Wrist",
          nodeName:
            "Wonderful Wristguards",
          nodeKey: "addon:107884",
          rank: 20,
          maxRank: 20
        })
      ]
    });

    renderTable(
      createDetail([synblast])
    );

    expect(
      screen.getAllByText(
        "Synblast"
      )
    ).toHaveLength(1);

    expect(
      screen.getByText(
        "Securely Shaped"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Mighty Mantles"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Wonderful Wristguards"
      )
    ).toBeInTheDocument();
  });

  it("groups Leather and Mail into separate family sections", () => {
    const synfel = createCoverage({
      character: {
        id: "character-2",
        name: "Synfel",
        realm: "Antonidas",
        className: "Demon Hunter",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          familyName: "Mail",
          slotKey: "WRIST",
          slotName: "Wrist",
          nodeName:
            "Balanced Bracers",
          nodeKey: "addon:107988",
          rank: 15,
          maxRank: 20
        })
      ]
    });

    const synblast = createCoverage({
      character: {
        id: "character-1",
        name: "Synblast",
        realm: "Antonidas",
        className: "Shaman",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          familyName: "Leather",
          slotKey: "WRIST",
          slotName: "Wrist"
        })
      ]
    });

    renderTable(
      createDetail([
        synfel,
        synblast
      ])
    );

    expect(
      screen.getByText("Leather")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Mail")
    ).toBeInTheDocument();
  });

  it("Synbomb acceptance case: appears under General/Profession with his real ranks, not as globally unspecialized", () => {
    const synbomb = createCoverage({
      character: {
        id: "character-3",
        name: "Synbomb",
        realm: "Antonidas",
        className: "Warrior",
        level: 80
      },
      specializationEquipment: [],
      generalSpecialization: [
        {
          nodeKey:
            "addon:107817",
          nodeName:
            "Flawless Fortes",
          nodeIconUrl: null,
          rank: 30,
          maxRank: 30
        },
        {
          nodeKey:
            "addon:107921",
          nodeName:
            "Learned Leatherworker",
          nodeIconUrl: null,
          rank: 8,
          maxRank: 30
        }
      ]
    });

    renderTable(
      createDetail([synbomb])
    );

    expect(
      screen.getByText(
        "General / Profession"
      )
    ).toBeInTheDocument();

    const generalSection =
      screen
        .getByText(
          "General / Profession"
        )
        .closest(
          ".profession-responsibility-family-group"
        ) as HTMLElement;

    expect(
      within(
        generalSection
      ).getByText("Synbomb")
    ).toBeInTheDocument();

    expect(
      within(
        generalSection
      ).getByText(
        "Flawless Fortes"
      )
    ).toBeInTheDocument();

    expect(
      within(
        generalSection
      ).getByText(
        "Learned Leatherworker"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /No verified equipment specialization/i
      )
    ).toBeInTheDocument();
  });
});
