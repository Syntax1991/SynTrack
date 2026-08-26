import {
  render,
  screen,
  within
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { ProfessionOverviewItem } from "../types/professionDetail.types";
import { ProfessionOverviewRow } from "./ProfessionOverviewRow";

function createProfession(
  overrides: Partial<ProfessionOverviewItem> &
    Pick<
      ProfessionOverviewItem,
      "id" | "name" | "category"
    >
): ProfessionOverviewItem {
  return {
    key: overrides.id,
    characterCount: 0,
    trackedCharacterCount: 0,
    activeNodeCount: 0,
    catalogRecipeCount: 0,
    capabilityCount: 0,
    captureStatus: "CAPTURED",
    lastCapturedAt: null,
    ...overrides
  };
}

function renderRows(
  professions: ProfessionOverviewItem[]
) {
  return render(
    <MemoryRouter>
      {professions.map(
        (profession) => (
          <ProfessionOverviewRow
            key={profession.id}
            profession={profession}
          />
        )
      )}
    </MemoryRouter>
  );
}

/*
 * This is the exact regression the P0 report caught: the earlier
 * component rendered as raw stacked text with no structural grouping.
 * These tests assert the STRUCTURE (one row per profession, counts and
 * the nav action living inside that same row) rather than CSS, since
 * jsdom cannot verify pixel layout - that remains a manual visual check.
 */
describe("ProfessionOverviewRow", () => {
  it("renders each profession as one semantic row (a single link), not floating stacked text", () => {
    renderRows([
      createProfession({
        id: "1",
        name: "Alchemy",
        category: "CRAFTING",
        characterCount: 6,
        trackedCharacterCount: 6
      }),
      createProfession({
        id: "2",
        name: "Blacksmithing",
        category: "CRAFTING",
        characterCount: 6,
        trackedCharacterCount: 6
      })
    ]);

    expect(
      screen.getAllByRole("link")
    ).toHaveLength(2);
  });

  it("keeps the profession name, counts, and the navigation arrow all inside the same row", () => {
    renderRows([
      createProfession({
        id: "1",
        name: "Alchemy",
        category: "CRAFTING",
        characterCount: 6,
        trackedCharacterCount: 6,
        lastCapturedAt:
          "2026-08-25T23:37:00.000Z"
      })
    ]);

    const row = screen.getByRole(
      "link"
    );

    expect(
      within(row).getByText(
        "Alchemy"
      )
    ).toBeInTheDocument();

    expect(
      within(row).getByText(
        "6 characters · 6 specialized"
      )
    ).toBeInTheDocument();

    expect(
      within(row).getByText("→")
    ).toBeInTheDocument();
  });

  it("renders the profession name exactly once per row", () => {
    renderRows([
      createProfession({
        id: "1",
        name: "Alchemy",
        category: "CRAFTING",
        characterCount: 6,
        trackedCharacterCount: 6
      })
    ]);

    expect(
      screen.getAllByText("Alchemy")
    ).toHaveLength(1);
  });

  it("a healthy row never repeats the old verbose per-row labels", () => {
    renderRows([
      createProfession({
        id: "1",
        name: "Alchemy",
        category: "CRAFTING",
        characterCount: 6,
        trackedCharacterCount: 6,
        captureStatus: "CAPTURED",
        lastCapturedAt:
          "2026-08-25T23:37:00.000Z"
      })
    ]);

    expect(
      screen.queryByText(
        /crafting profession/i
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        /assigned characters/i
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        /with specialization data/i
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        /active paths\/slots/i
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        /refresh only when profession data changes/i
      )
    ).not.toBeInTheDocument();
  });

  it("a Gathering profession with no tracked characters stays compact - a single 'Not tracked' line, not a multi-line block", () => {
    renderRows([
      createProfession({
        id: "1",
        name: "Herbalism",
        category: "GATHERING",
        characterCount: 0,
        captureStatus:
          "NOT_REQUIRED"
      })
    ]);

    const row = screen.getByRole(
      "link"
    );

    expect(
      within(row).getByText(
        "Not tracked"
      )
    ).toBeInTheDocument();

    expect(
      within(row).queryByText(
        /characters ·/
      )
    ).not.toBeInTheDocument();

    expect(
      within(row).queryByText(
        /updated/i
      )
    ).not.toBeInTheDocument();
  });

  it("associates the counts/attention text with the specific profession they describe, not a shared block", () => {
    renderRows([
      createProfession({
        id: "1",
        name: "Alchemy",
        category: "CRAFTING",
        characterCount: 6,
        trackedCharacterCount: 6
      }),
      createProfession({
        id: "2",
        name: "Inscription",
        category: "CRAFTING",
        characterCount: 4,
        trackedCharacterCount: 3
      })
    ]);

    const rows = screen.getAllByRole(
      "link"
    );

    expect(
      within(rows[0]).getByText(
        "6 characters · 6 specialized"
      )
    ).toBeInTheDocument();

    expect(
      within(rows[1]).getByText(
        "4 characters · 3 specialized"
      )
    ).toBeInTheDocument();

    expect(
      within(rows[1]).getByText(
        "1 needs specialization"
      )
    ).toBeInTheDocument();

    expect(
      within(rows[0]).queryByText(
        "1 needs specialization"
      )
    ).not.toBeInTheDocument();
  });
});
