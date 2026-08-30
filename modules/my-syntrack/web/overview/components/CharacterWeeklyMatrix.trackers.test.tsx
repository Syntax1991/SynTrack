import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  CharacterTrackerState,
  TrackerDefinitionView
} from "../types/overview.types";
import {
  buildCharacter,
  renderMatrix
} from "./characterWeeklyMatrixTestHelpers";

describe("CharacterWeeklyMatrix - pinned tracker columns", () => {
  it("renders a pinned+enabled tracker as a matrix column and keeps filtering/sorting working alongside it", () => {
    const definition: TrackerDefinitionView = {
      id: "tracker-1",
      scopeKey: "MIDNIGHT-S1",
      key: "world-tour",
      name: "World Tour",
      valueType: "BOOLEAN",
      resetBehavior: "SEASONAL",
      category: null,
      sortOrder: 0,
      isPinned: true,
      enabled: true
    };

    const trueState: CharacterTrackerState = {
      trackerDefinitionId: "tracker-1",
      characterId: "char-1",
      periodKey: "ALWAYS",
      state: "RECORDED",
      source: "MANUAL",
      value: { valueType: "BOOLEAN", boolean: true }
    };

    renderMatrix(
      [
        buildCharacter({
          character: {
            id: "char-1",
            name: "Synblast",
            realm: "Antonidas",
            region: "eu",
            className: "Shaman",
            level: 80
          },
          trackers: [trueState],
          readinessState: "ready"
        }),
        buildCharacter({
          character: {
            id: "char-2",
            name: "Synbloom",
            realm: "Antonidas",
            region: "eu",
            className: "Druid",
            level: 80
          },
          trackers: [],
          readinessState: "attention",
          attentionItems: [
            {
              id: "char-2:profession",
              characterId: "char-2",
              characterName: "Synbloom",
              domain: "profession",
              severity: "this-week",
              label: "1 Leatherworking Knowledge Treasure missing",
              detail: null,
              path: "/characters/char-2"
            }
          ]
        })
      ],
      [definition]
    );

    expect(
      screen.getByText("World Tour")
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    const synblastRow = within(rows[1]!);
    const synbloomRow = within(rows[2]!);

    expect(
      synblastRow.getByTitle("Complete")
    ).toHaveTextContent("✓");

    expect(
      synbloomRow.getByTitle("Not recorded yet")
    ).toHaveTextContent("?");

    fireEvent.click(
      screen.getByRole("button", { name: "Attention" })
    );

    expect(
      screen.queryByText("Synblast")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Synbloom")
    ).toBeInTheDocument();
  });
});
