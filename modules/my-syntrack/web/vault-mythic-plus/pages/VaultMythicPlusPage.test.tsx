import {
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type { VaultMythicPlusResponse } from "../types/vaultMythicPlus.types";

const addRun = vi
  .fn()
  .mockResolvedValue(true);

const deleteRun = vi
  .fn()
  .mockResolvedValue(undefined);

const mockOverview: VaultMythicPlusResponse =
  {
    period: {
      key: "2026-08-26",
      startsAt:
        "2026-08-26T07:00:00.000Z",
      endsAt:
        "2026-09-02T07:00:00.000Z"
    },
    thresholds: [1, 4, 8],
    characters: [
      {
        id: "char-1",
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        className: "Shaman",
        level: 80,
        runs: [
          {
            id: "run-1",
            dungeonName:
              "Necrotic Wake",
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
      },
      {
        id: "char-2",
        name: "Synbloom",
        realm: "Antonidas",
        region: "eu",
        className: "Druid",
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
        highestKeyLevel: null
      }
    ],
    summary: {
      runCount: 1,
      unlockedSlotCount: 1,
      charactersWithVault: 1
    }
  };

vi.mock(
  "../hooks/useVaultMythicPlus",
  () => ({
    useVaultMythicPlus: () => ({
      overview: mockOverview,
      isLoading: false,
      error: null,
      pendingAction: null,
      addRun,
      deleteRun
    })
  })
);

const { VaultMythicPlusPage } =
  await import(
    "./VaultMythicPlusPage"
  );

function renderPage() {
  return render(
    <MemoryRouter>
      <VaultMythicPlusPage />
    </MemoryRouter>
  );
}

describe("VaultMythicPlusPage", () => {
  it("never renders the old four KPI cards, replacing them with one compact summary line", () => {
    renderPage();

    expect(
      screen.getByText(
        /1 logged runs · 1 tracked Vaults · Reset/
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Dungeon runs"
      )
    ).not.toBeInTheDocument();
  });

  it("renders the account-wide matrix directly, without a separate character roster selection step", () => {
    renderPage();

    expect(
      screen.getAllByText("Synblast")
        .length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Synbloom")
        .length
    ).toBeGreaterThan(0);

    expect(
      screen.queryByText(
        "VAULT ROSTER"
      )
    ).not.toBeInTheDocument();
  });

  it("opens the run log drawer for the correct character, and only that character's run history is shown", () => {
    renderPage();

    const rows = screen.getAllByRole("row");
    const synbloomRow = within(rows[2]!);

    fireEvent.click(
      synbloomRow.getByRole("button", {
        name: "Log run"
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Log run · Synbloom"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "No runs logged yet"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Necrotic Wake"
      )
    ).not.toBeInTheDocument();
  });

  it("adding a run in the drawer targets the correct character, not another one", async () => {
    renderPage();

    const rows = screen.getAllByRole("row");
    const synblastRow = within(rows[1]!);

    fireEvent.click(
      synblastRow.getByRole("button", {
        name: "Log run"
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add run"
      })
    );

    await vi.waitFor(() => {
      expect(addRun).toHaveBeenCalledWith(
        "char-1",
        expect.objectContaining({
          keyLevel: 2
        })
      );
    });

    expect(addRun).not.toHaveBeenCalledWith(
      "char-2",
      expect.anything()
    );
  });
});
