import {
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { VaultCharacter } from "../types/vaultMythicPlus.types";
import { VaultMatrix } from "./VaultMatrix";

function buildCharacter(
  overrides: Partial<VaultCharacter> = {}
): VaultCharacter {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80,
    runs: [],
    vaultSlots: [
      {
        threshold: 1,
        unlocked: false,
        keyLevel: null
      },
      {
        threshold: 4,
        unlocked: false,
        keyLevel: null
      },
      {
        threshold: 8,
        unlocked: false,
        keyLevel: null
      }
    ],
    highestKeyLevel: null,
    ...overrides
  };
}

function renderWithRouter(
  node: ReactNode
) {
  return render(
    <MemoryRouter>{node}</MemoryRouter>
  );
}

describe("VaultMatrix", () => {
  it("renders exactly one row per character", () => {
    renderWithRouter(
      <VaultMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            name: "Synblast"
          }),
          buildCharacter({
            id: "char-2",
            name: "Synbloom"
          })
        ]}
        onOpenRunLog={vi.fn()}
      />
    );

    expect(
      screen.getAllByRole("row")
    ).toHaveLength(3);
  });

  it("links the character name while keeping Log run as a separate action", () => {
    renderWithRouter(
      <VaultMatrix
        characters={[
          buildCharacter({
            id: "char-7"
          })
        ]}
        onOpenRunLog={vi.fn()}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "Synblast"
      })
    ).toHaveAttribute(
      "href",
      "/characters/char-7"
    );

    expect(
      screen.getByRole("button", {
        name: "Log run"
      })
    ).toBeInTheDocument();
  });

  it("renders zero-runs Vault state as UNKNOWN ('?'), never a fake 0/N, and keeps it distinguishable from real progress", () => {
    renderWithRouter(
      <VaultMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            name: "Synblast",
            runs: []
          }),
          buildCharacter({
            id: "char-2",
            name: "Synbloom",
            runs: [
              {
                id: "run-1",
                dungeonName: "Necrotic Wake",
                keyLevel: 10,
                completedAt:
                  "2026-08-26T10:00:00.000Z"
              }
            ],
            vaultSlots: [
              {
                threshold: 1,
                unlocked: true,
                keyLevel: 10
              },
              {
                threshold: 4,
                unlocked: false,
                keyLevel: null
              },
              {
                threshold: 8,
                unlocked: false,
                keyLevel: null
              }
            ],
            highestKeyLevel: 10
          })
        ]}
        onOpenRunLog={vi.fn()}
      />
    );

    const rows = screen.getAllByRole("row");
    const synblastRow = within(rows[1]!);
    const synbloomRow = within(rows[2]!);

    expect(
      synblastRow.getAllByTitle(
        "No Vault run history logged for this period"
      )
    ).toHaveLength(3);

    expect(
      synbloomRow.queryAllByTitle(
        "No Vault run history logged for this period"
      )
    ).toHaveLength(0);

    expect(
      synbloomRow.getByTitle(
        "Unlocked with 1 run logged"
      )
    ).toHaveTextContent("✓ +10");
  });

  it("keeps the 1/4/8 slot-unlock math correct and each character's slot state in its own row", () => {
    renderWithRouter(
      <VaultMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            name: "Synblast",
            runs: Array.from(
              { length: 4 },
              (_, index) => ({
                id: `run-${index}`,
                dungeonName: null,
                keyLevel: 10 - index,
                completedAt:
                  "2026-08-26T10:00:00.000Z"
              })
            ),
            vaultSlots: [
              {
                threshold: 1,
                unlocked: true,
                keyLevel: 10
              },
              {
                threshold: 4,
                unlocked: true,
                keyLevel: 7
              },
              {
                threshold: 8,
                unlocked: false,
                keyLevel: null
              }
            ],
            highestKeyLevel: 10
          }),
          buildCharacter({
            id: "char-2",
            name: "Synbloom",
            runs: []
          })
        ]}
        onOpenRunLog={vi.fn()}
      />
    );

    const rows = screen.getAllByRole("row");
    const synblastRow = within(rows[1]!);
    const synbloomRow = within(rows[2]!);

    expect(
      synblastRow.getByTitle(
        "Unlocks at 8 runs (4 more needed)"
      )
    ).toHaveTextContent("4 more");

    expect(
      synbloomRow.queryByTitle(
        "Unlocks at 8 runs (4 more needed)"
      )
    ).not.toBeInTheDocument();
  });

  it("opens the run log for the correct character when its row action is clicked", () => {
    const onOpenRunLog = vi.fn();

    renderWithRouter(
      <VaultMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            name: "Synblast"
          }),
          buildCharacter({
            id: "char-2",
            name: "Synbloom"
          })
        ]}
        onOpenRunLog={onOpenRunLog}
      />
    );

    const rows = screen.getAllByRole("row");
    const synbloomRow = within(rows[2]!);

    fireEvent.click(
      synbloomRow.getByRole("button", {
        name: "Log run"
      })
    );

    expect(onOpenRunLog).toHaveBeenCalledWith(
      "char-2"
    );

    expect(onOpenRunLog).not.toHaveBeenCalledWith(
      "char-1"
    );
  });
});
