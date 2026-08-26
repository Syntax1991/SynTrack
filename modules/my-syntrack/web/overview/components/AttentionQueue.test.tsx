import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { AttentionItem } from "../types/overview.types";
import { AttentionQueue } from "./AttentionQueue";

function renderQueue(
  attentionItems: AttentionItem[]
) {
  return render(
    <MemoryRouter>
      <AttentionQueue
        attentionItems={
          attentionItems
        }
      />
    </MemoryRouter>
  );
}

describe("AttentionQueue", () => {
  it("shows the correct character, domain and action for each attention item", () => {
    renderQueue([
      {
        id: "char-1:gear",
        characterId: "char-1",
        characterName: "Synlight",
        domain: "gear",
        severity: "this-week",
        label: "Gear needs attention",
        detail: "1 missing enchant",
        path: "/gear-readiness"
      }
    ]);

    const row = within(
      screen.getByRole("link", {
        name: /Gear needs attention/
      })
    );

    expect(
      row.getByText("Synlight")
    ).toBeInTheDocument();

    expect(
      row.getByText("Gear")
    ).toBeInTheDocument();

    expect(
      row.getByText(
        "1 missing enchant"
      )
    ).toBeInTheDocument();
  });

  it("links each row to its real existing domain route", () => {
    renderQueue([
      {
        id: "char-2:weekly",
        characterId: "char-2",
        characterName: "Synspin",
        domain: "weekly",
        severity: "this-week",
        label:
          "Weekly tasks remaining",
        detail: "2 of 5 tasks left",
        path: "/weekly-checklist"
      }
    ]);

    expect(
      screen.getByRole("link", {
        name: /Weekly tasks remaining/
      })
    ).toHaveAttribute(
      "href",
      "/weekly-checklist"
    );
  });

  it("shows an explicit empty state when nothing needs attention, never a fabricated row", () => {
    renderQueue([]);

    expect(
      screen.getByText(
        "Nothing needs attention right now."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link")
    ).not.toBeInTheDocument();
  });
});
