import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { OverviewPriorities } from "../types/overviewPriority.types";
import { PriorityActionLayer } from "./PriorityActionLayer";

const priorities: OverviewPriorities = {
  topActions: [
    {
      id: "char-1:weekly",
      characterId: "char-1",
      characterName: "Synlight",
      domain: "weekly",
      domainLabel: "WEEKLIES",
      severity: "this-week",
      label: "1 World activity for Vault slot 1",
      detail: null,
      path: "/weekly-checklist",
      score: 4200,
      bucket: "quick-wins",
      effort: "low"
    },
    {
      id: "char-2:weekly",
      characterId: "char-2",
      characterName: "Syndraco",
      domain: "weekly",
      domainLabel: "WEEKLIES",
      severity: "this-week",
      label: "4 more M+ runs for Vault slot 3",
      detail: null,
      path: "/vault-mythic-plus",
      score: 4000,
      bucket: "this-week",
      effort: "medium"
    }
  ],
  buckets: {
    needsAttention: [],
    quickWins: [],
    thisWeek: []
  },
  readyCharacterCount: 3
};

describe("PriorityActionLayer", () => {
  it("renders ranked account-level next actions", () => {
    render(
      <MemoryRouter>
        <PriorityActionLayer priorities={priorities} />
      </MemoryRouter>
    );

    expect(
      screen.getByText("Worth doing next")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Synlight")
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 World activity for Vault slot 1")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Syndraco.*4 more M\+ runs/
      })
    ).toHaveAttribute("href", "/vault-mythic-plus");
  });
});
