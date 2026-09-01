import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProfessionWorkMatrix } from "./ProfessionWorkMatrix";
import type { ProfessionOverviewWorkRow } from "../types/professionOverviewWork.types";

function row(
  overrides: Partial<ProfessionOverviewWorkRow> = {}
): ProfessionOverviewWorkRow {
  return {
    character: {
      id: "char-1",
      name: "Synblast",
      realm: "Silvermoon",
      region: "EU",
      className: "Mage"
    },
    profession: {
      id: "prof-alchemy",
      key: "alchemy",
      name: "Alchemy",
      category: "CRAFTING"
    },
    skill: {
      current: 100,
      display: "100"
    },
    investedKnowledge: {
      meaning: "INVESTED",
      invested: 0,
      display: "0"
    },
    weekly: {
      state: "COMPLETE",
      summary: "✓"
    },
    quest: {
      state: "COMPLETE",
      label: "✓"
    },
    treatise: {
      state: "COMPLETE",
      label: "✓"
    },
    drops: {
      state: "COMPLETE",
      label: "✓"
    },
    treasures: {
      state: "COMPLETE",
      label: "8/8"
    },
    attention: {
      weekly: false,
      permanent: false
    },
    nextAction: "Weekly complete",
    sortRank: 3,
    ...overrides
  };
}

describe("ProfessionWorkMatrix", () => {
  it("renders dense profession work columns", () => {
    render(
      <MemoryRouter>
        <ProfessionWorkMatrix rows={[row()]} />
      </MemoryRouter>
    );

    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("Profession")).toBeInTheDocument();
    expect(screen.getByText("Quest")).toBeInTheDocument();
    expect(screen.getByText("Treat.")).toBeInTheDocument();
    expect(screen.getByText("Drops")).toBeInTheDocument();
    expect(screen.getByText("Invest.")).toBeInTheDocument();
    expect(screen.getByText("Synblast")).toBeInTheDocument();
    expect(screen.getByText("Alchemy")).toBeInTheDocument();
    expect(
      screen.getByText("Weekly complete")
    ).toBeInTheDocument();
  });

  it("filters to attention rows only", () => {
    render(
      <MemoryRouter>
        <ProfessionWorkMatrix
          rows={[
            row(),
            row({
              character: {
                id: "char-2",
                name: "Synbanks",
                realm: "Silvermoon",
                region: "EU",
                className: "Priest"
              },
              weekly: {
                state: "ATTENTION",
                summary: "Quest"
              },
              quest: {
                state: "INCOMPLETE",
                label: "!"
              },
              attention: {
                weekly: true,
                permanent: false
              },
              nextAction: "Complete weekly quest",
              sortRank: 0
            })
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Synblast")).toBeInTheDocument();
    expect(screen.getByText("Synbanks")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Attention"
      })
    );

    expect(screen.queryByText("Synblast")).not.toBeInTheDocument();
    expect(screen.getByText("Synbanks")).toBeInTheDocument();
  });
});
