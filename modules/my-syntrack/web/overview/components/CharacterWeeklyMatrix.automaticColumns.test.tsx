import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildCharacter,
  renderMatrix
} from "./characterWeeklyMatrixTestHelpers";

describe("CharacterWeeklyMatrix triage columns", () => {
  it("defaults to triage columns with Spark/Cata and without Treasure or Res.", () => {
    renderMatrix([
      buildCharacter({
        weeklySummary: {
          state: "ATTENTION",
          completedKnown: 2,
          applicableKnown: 4,
          unknownCount: 4,
          domains: []
        },
        professionSetup: {
          state: "READY",
          professions: [
            {
              professionId: "alchemy",
              key: "alchemy",
              name: "Alchemy",
              dataStatus: "TRACKED",
              treasures: {
                completeCount: 8,
                incompleteCount: 0,
                unknownCount: 0,
                applicableTotal: 8
              }
            }
          ],
          dataIssues: []
        }
      })
    ]);

    expect(screen.getByText("iLvl")).toBeInTheDocument();
    expect(screen.getByText("Set")).toBeInTheDocument();
    expect(screen.getByText("Emb.")).toBeInTheDocument();
    expect(screen.getByText("Weeklies")).toBeInTheDocument();
    expect(screen.getByText("Prof.")).toBeInTheDocument();
    expect(screen.getByText("Gear")).toBeInTheDocument();
    expect(screen.getByText("Spark")).toBeInTheDocument();
    expect(screen.getByText("Cata")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();

    expect(screen.queryByText("Res.")).not.toBeInTheDocument();
    expect(screen.queryByText("Treasure")).not.toBeInTheDocument();
    expect(screen.queryByText("TREASURE")).not.toBeInTheDocument();
    expect(screen.queryByText("Vault")).not.toBeInTheDocument();
    expect(screen.queryByText("Quest")).not.toBeInTheDocument();
    expect(screen.queryByText("Treat.")).not.toBeInTheDocument();
    expect(screen.queryByText("Drops")).not.toBeInTheDocument();
  });

  it("shows PROF attention when permanent treasures are incomplete", () => {
    renderMatrix([
      buildCharacter({
        professionSetup: {
          state: "ATTENTION",
          professions: [
            {
              professionId: "leatherworking",
              key: "leatherworking",
              name: "Leatherworking",
              dataStatus: "TRACKED",
              treasures: {
                completeCount: 7,
                incompleteCount: 1,
                unknownCount: 0,
                applicableTotal: 8
              }
            }
          ],
          dataIssues: []
        },
        nextAction: {
          domain: "profession",
          label: "1 Leatherworking Knowledge Treasure missing",
          detail: null,
          path: "/characters/char-1",
          severity: "this-week"
        }
      })
    ]);

    expect(
      screen.getByText("1 Leatherworking Knowledge Treasure missing")
    ).toBeInTheDocument();
    expect(screen.queryByText("Treasure")).not.toBeInTheDocument();
  });

  it("renders Spark and Cata from the existing resource read model", () => {
    renderMatrix([
      buildCharacter({
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
                capturedAt: "2026-08-28T12:00:00.000Z"
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
                capturedAt: "2026-08-28T12:00:00.000Z"
              },
              attentionNeeded: false
            }
          ]
        }
      })
    ]);

    expect(screen.getByText("Spark")).toBeInTheDocument();
    expect(screen.getByText("Cata")).toBeInTheDocument();
    expect(screen.getByText("4/5")).toBeInTheDocument();
    expect(screen.getByText("1/8")).toBeInTheDocument();
    expect(screen.queryByText("Res.")).not.toBeInTheDocument();
  });
});
