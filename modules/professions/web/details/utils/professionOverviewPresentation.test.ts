import { describe, expect, it } from "vitest";
import type { ProfessionOverviewItem } from "../types/professionDetail.types";
import {
  getProfessionOverviewRowPresentation,
  groupProfessionOverviewByCategory
} from "./professionOverviewPresentation";

function createProfession(
  overrides: Partial<ProfessionOverviewItem> &
    Pick<ProfessionOverviewItem, "id" | "name" | "category">
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

describe("groupProfessionOverviewByCategory", () => {
  it("groups Crafting and Gathering into separate, distinctly labeled groups", () => {
    const groups =
      groupProfessionOverviewByCategory(
        [
          createProfession({
            id: "1",
            name: "Alchemy",
            category: "CRAFTING"
          }),
          createProfession({
            id: "2",
            name: "Herbalism",
            category: "GATHERING"
          })
        ]
      );

    expect(
      groups.map(
        (group) => group.categoryLabel
      )
    ).toEqual([
      "Crafting",
      "Gathering"
    ]);
  });

  it("keeps every profession in exactly one category group", () => {
    const groups =
      groupProfessionOverviewByCategory(
        [
          createProfession({
            id: "1",
            name: "Alchemy",
            category: "CRAFTING"
          }),
          createProfession({
            id: "2",
            name: "Blacksmithing",
            category: "CRAFTING"
          }),
          createProfession({
            id: "3",
            name: "Mining",
            category: "GATHERING"
          })
        ]
      );

    const crafting = groups.find(
      (group) =>
        group.category === "CRAFTING"
    );

    expect(
      crafting?.items.map(
        (item) => item.name
      )
    ).toEqual([
      "Alchemy",
      "Blacksmithing"
    ]);
  });
});

describe("getProfessionOverviewRowPresentation", () => {
  it("collapses a zero-character profession to a single 'Not tracked' state, never fabricating counts", () => {
    const presentation =
      getProfessionOverviewRowPresentation(
        createProfession({
          id: "1",
          name: "Herbalism",
          category: "GATHERING",
          characterCount: 0
        })
      );

    expect(
      presentation.isTracked
    ).toBe(false);

    expect(
      presentation.countsLine
    ).toBeNull();

    expect(
      presentation.attentionLine
    ).toBeNull();
  });

  it("shows a quiet counts-only line for a healthy fully-specialized profession - no attention line", () => {
    const presentation =
      getProfessionOverviewRowPresentation(
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
      );

    expect(
      presentation.countsLine
    ).toBe(
      "6 characters · 6 specialized"
    );

    expect(
      presentation.attentionLine
    ).toBeNull();

    expect(
      presentation.updatedLine
    ).toMatch(/^Updated /);
  });

  it("Inscription acceptance case: shows a 'needs specialization' attention line when some characters lack specialization data", () => {
    const presentation =
      getProfessionOverviewRowPresentation(
        createProfession({
          id: "1",
          name: "Inscription",
          category: "CRAFTING",
          characterCount: 4,
          trackedCharacterCount: 3,
          captureStatus: "CAPTURED",
          lastCapturedAt:
            "2026-08-26T01:08:00.000Z"
        })
      );

    expect(
      presentation.countsLine
    ).toBe(
      "4 characters · 3 specialized"
    );

    expect(
      presentation.attentionLine
    ).toBe(
      "1 needs specialization"
    );
  });

  it("shows an 'Import needed' attention line for a profession that has never been captured", () => {
    const presentation =
      getProfessionOverviewRowPresentation(
        createProfession({
          id: "1",
          name: "Enchanting",
          category: "CRAFTING",
          characterCount: 2,
          trackedCharacterCount: 0,
          captureStatus: "NOT_CAPTURED"
        })
      );

    expect(
      presentation.attentionLine
    ).toBe("Import needed");
  });

  it("uses plural 'need' when more than one character needs specialization", () => {
    const presentation =
      getProfessionOverviewRowPresentation(
        createProfession({
          id: "1",
          name: "Jewelcrafting",
          category: "CRAFTING",
          characterCount: 5,
          trackedCharacterCount: 2,
          captureStatus: "CAPTURED"
        })
      );

    expect(
      presentation.attentionLine
    ).toBe(
      "3 need specialization"
    );
  });
});
