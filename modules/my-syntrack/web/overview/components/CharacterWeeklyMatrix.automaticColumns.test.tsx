import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildCharacter,
  renderMatrix
} from "./characterWeeklyMatrixTestHelpers";

describe("CharacterWeeklyMatrix automatic columns", () => {
  it("shows Quest, Treat., and Drops as separate additive columns, alongside the existing Prof. data-health column", () => {
    renderMatrix([
      buildCharacter({
        character: {
          id: "char-1",
          name: "Synfel",
          realm: "Antonidas",
          region: "eu",
          className: "Mage",
          level: 80
        },
        professionWeekly: {
          state: "ATTENTION",
          quest: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          treatise: {
            completeCount: 1,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 2
          },
          drops: {
            completeCount: 0,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 0
          },
          professions: []
        }
      })
    ]);

    expect(
      screen.getByText("Quest")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Treat.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Drops")
    ).toBeInTheDocument();

    expect(
      screen.getByText("✓")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1/2")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Prof KP")
    ).not.toBeInTheDocument();
  });

  it("shows Spark and Cata as dedicated count/max columns, replacing the generic Res. column", () => {
    renderMatrix([
      buildCharacter({
        character: {
          id: "char-1",
          name: "Synlight",
          realm: "Antonidas",
          region: "eu",
          className: "Paladin",
          level: 80
        },
        resources: {
          state: "READY",
          trackedResourceCount: 2,
          totalRelevantResourceCount: 2,
          attentionCount: 0,
          items: [
            {
              resourceDefinitionId: "def-spark",
              key: "tidal-spark-dust",
              name: "Tidal Spark Dust",
              category: "CRAFTING_GATE",
              snapshot: {
                quantity: 4,
                maxQuantity: 5,
                weeklyQuantity: null,
                maxWeeklyQuantity: null,
                isCapped: false,
                weeklyRemaining: null,
                weeklyComplete: null,
                capturedAt:
                  "2026-08-28T12:00:00.000Z"
              },
              attentionNeeded: false
            },
            {
              resourceDefinitionId: "def-cata",
              key: "venomblight-manaflux",
              name: "Venomblight Manaflux",
              category: "CONVERSION",
              snapshot: {
                quantity: 1,
                maxQuantity: 8,
                weeklyQuantity: null,
                maxWeeklyQuantity: null,
                isCapped: false,
                weeklyRemaining: null,
                weeklyComplete: null,
                capturedAt:
                  "2026-08-28T12:00:00.000Z"
              },
              attentionNeeded: false
            }
          ]
        }
      })
    ]);

    expect(
      screen.getByText("Spark")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Cata")
    ).toBeInTheDocument();

    expect(
      screen.getByText("4/5")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1/8")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Res.")
    ).not.toBeInTheDocument();
  });
});
