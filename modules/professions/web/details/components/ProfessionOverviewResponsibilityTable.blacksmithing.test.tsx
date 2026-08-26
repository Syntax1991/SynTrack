import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProfessionOverviewResponsibilityTable } from "./ProfessionOverviewResponsibilityTable";
import {
  createClaim,
  createCoverage,
  createDetail,
  renderTable
} from "./professionOverviewResponsibilityTable.fixtures";

describe("ProfessionOverviewResponsibilityTable - Blacksmithing Armor acceptance", () => {
  it("renders Chest and Legs as two separate rows (never merged 'Chest / Legs'), each showing its OWN specific node - never the 'Large Plate Armor' bundle that happens to be invested", () => {
    const synbeam = createCoverage({
      character: {
        id: "character-4",
        name: "Synbeam",
        realm: "Antonidas",
        className: "Death Knight",
        level: 80
      },
      explicitSlotNodeRanks: [
        {
          capabilityKey: "Plate:CHEST",
          presentationGroup: "Armor",
          familyName: "Plate",
          slotKey: "CHEST",
          slotName: "Chest",
          nodeName: "Chestplates",
          nodeKey: "addon:104574",
          nodeIconUrl: null,
          rank: 0,
          maxRank: 25,
          hasProvenInvestment: true
        },
        {
          capabilityKey: "Plate:LEGS",
          presentationGroup: "Armor",
          familyName: "Plate",
          slotKey: "LEGS",
          slotName: "Legs",
          nodeName: "Greaves",
          nodeKey: "addon:104573",
          nodeIconUrl: null,
          rank: 0,
          maxRank: 25,
          hasProvenInvestment: true
        },
        {
          capabilityKey: "Shield:OFF_HAND",
          presentationGroup: "Armor",
          familyName: "Shield",
          slotKey: "OFF_HAND",
          slotName: "Shield",
          nodeName: "Shields",
          nodeKey: "addon:104572",
          nodeIconUrl: null,
          rank: 16,
          maxRank: 25,
          hasProvenInvestment: true
        }
      ]
    });

    renderTable(
      createDetail([synbeam])
    );

    const headings =
      document.querySelectorAll(
        ".profession-responsibility-family-heading"
      );

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(
      "Armor"
    );

    expect(
      screen.queryByText("Plate")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Chest")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Legs")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Chest / Legs")
    ).not.toBeInTheDocument();

    // P0 regression: Chest and Legs must show their OWN real specific
    // node (Chestplates 0/25, Greaves 0/25) - never the "Large Plate
    // Armor" bundle, even though the bundle is the one actually invested.
    expect(
      screen.queryByText("Large Plate Armor")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Chestplates")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Greaves")
    ).toBeInTheDocument();

    const rows =
      document.querySelectorAll(
        ".profession-responsibility-slot-row"
      );

    expect(rows).toHaveLength(3);

    expect(
      screen.getByText("Shields")
    ).toBeInTheDocument();
  });

  it("clicking a Shield row inside the Armor section deep-links Find Craft with the real Shield family, never the Armor heading", () => {
    const onNavigateToFindCraft = vi.fn();

    const synbeam = createCoverage({
      character: {
        id: "character-4",
        name: "Synbeam",
        realm: "Antonidas",
        className: "Death Knight",
        level: 80
      },
      specializationEquipment: [
        createClaim({
          presentationGroup: "Armor",
          familyName: "Plate",
          slotKey: "CHEST",
          slotName: "Chest",
          nodeName: "Large Plate Armor",
          nodeKey: "addon:104575",
          rank: 30,
          maxRank: 30
        }),
        createClaim({
          presentationGroup: "Armor",
          familyName: "Shield",
          slotKey: "OFF_HAND",
          slotName: "Shield",
          nodeName: "Shields",
          nodeKey: "addon:104572",
          rank: 16,
          maxRank: 25
        })
      ]
    });

    render(
      <MemoryRouter>
        <ProfessionOverviewResponsibilityTable
          detail={createDetail([
            synbeam
          ])}
          onNavigateToFindCraft={
            onNavigateToFindCraft
          }
        />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Shield"
      })
    );

    expect(
      onNavigateToFindCraft
    ).toHaveBeenCalledWith(
      "Shield",
      "OFF_HAND"
    );
  });
});
