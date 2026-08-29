import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildCharacter,
  renderMatrix
} from "./characterWeeklyMatrixTestHelpers";

describe("CharacterWeeklyMatrix triage columns", () => {
  it("defaults to triage columns without weekly sub-detail or Spark/Cata", () => {
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

    expect(screen.getByText("Weeklies")).toBeInTheDocument();
    expect(screen.getByText("Prof.")).toBeInTheDocument();
    expect(screen.getByText("Gear")).toBeInTheDocument();
    expect(screen.getByText("Res.")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();

    expect(screen.queryByText("Vault")).not.toBeInTheDocument();
    expect(screen.queryByText("Quest")).not.toBeInTheDocument();
    expect(screen.queryByText("Treat.")).not.toBeInTheDocument();
    expect(screen.queryByText("Drops")).not.toBeInTheDocument();
    expect(screen.queryByText("Spark")).not.toBeInTheDocument();
    expect(screen.queryByText("Cata")).not.toBeInTheDocument();
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
  });
});
