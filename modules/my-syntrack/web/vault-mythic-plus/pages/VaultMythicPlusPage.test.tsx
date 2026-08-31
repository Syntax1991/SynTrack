import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { VaultMythicPlusResponse } from "../types/vaultMythicPlus.types";

const mockOverview: VaultMythicPlusResponse = {
  period: {
    key: "2026-08-26",
    startsAt: "2026-08-26T07:00:00.000Z",
    endsAt: "2026-09-02T07:00:00.000Z"
  },
  characters: [
    {
      id: "char-1",
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      className: "Shaman",
      level: 90,
      trackingProfile: "FULL",
      vault: {
        state: "ATTENTION",
        completeCount: 6,
        applicableTotal: 9,
        knownUnlockedSlots: 6,
        maxSlots: 9,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      mythicPlus: {
        state: "READY",
        completeCount: 8,
        applicableTotal: 8,
        knownUnlockedSlots: 3,
        maxSlots: 3,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      raid: {
        state: "READY",
        completeCount: 6,
        applicableTotal: 6,
        knownUnlockedSlots: 3,
        maxSlots: 3,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      delves: {
        state: "ATTENTION",
        completeCount: 0,
        applicableTotal: 8,
        knownUnlockedSlots: 0,
        maxSlots: 3,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      mythicPlusSlots: [
        {
          slot: 1,
          state: "UNLOCKED",
          threshold: 1,
          progress: 8,
          level: 15,
          rewardLabel: "+15"
        },
        {
          slot: 2,
          state: "UNLOCKED",
          threshold: 4,
          progress: 8,
          level: 14,
          rewardLabel: "+14"
        },
        {
          slot: 3,
          state: "UNLOCKED",
          threshold: 8,
          progress: 8,
          level: 13,
          rewardLabel: "+13"
        }
      ],
      raidSlots: [
        {
          slot: 1,
          state: "UNLOCKED",
          threshold: 2,
          progress: 6,
          level: 15,
          rewardLabel: "Heroic"
        },
        {
          slot: 2,
          state: "UNLOCKED",
          threshold: 4,
          progress: 6,
          level: 15,
          rewardLabel: "Heroic"
        },
        {
          slot: 3,
          state: "UNLOCKED",
          threshold: 6,
          progress: 6,
          level: 15,
          rewardLabel: "Heroic"
        }
      ],
      worldSlots: [
        {
          slot: 1,
          state: "LOCKED",
          threshold: 2,
          progress: 0,
          level: 0,
          rewardLabel: null
        },
        {
          slot: 2,
          state: "LOCKED",
          threshold: 4,
          progress: 0,
          level: 0,
          rewardLabel: null
        },
        {
          slot: 3,
          state: "LOCKED",
          threshold: 8,
          progress: 0,
          level: 0,
          rewardLabel: null
        }
      ],
      highestKeyLevel: 15,
      mythicPlusRunCount: 2,
      mythicPlusRuns: [
        {
          mapChallengeModeId: 503,
          keyLevel: 15,
          completed: true,
          thisWeek: true,
          durationSec: 1800
        }
      ],
      action: "2 World activities for Vault slot 1",
      vaultCaptured: true,
      vaultCurrent: true
    },
    {
      id: "char-2",
      name: "Syndraco",
      realm: "Antonidas",
      region: "eu",
      className: "Evoker",
      level: 90,
      trackingProfile: "FULL",
      vault: {
        state: "ATTENTION",
        completeCount: 2,
        applicableTotal: 9,
        knownUnlockedSlots: 2,
        maxSlots: 9,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      mythicPlus: {
        state: "ATTENTION",
        completeCount: 4,
        applicableTotal: 8,
        knownUnlockedSlots: 2,
        maxSlots: 3,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      raid: {
        state: "ATTENTION",
        completeCount: 0,
        applicableTotal: 6,
        knownUnlockedSlots: 0,
        maxSlots: 3,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      delves: {
        state: "ATTENTION",
        completeCount: 0,
        applicableTotal: 8,
        knownUnlockedSlots: 0,
        maxSlots: 3,
        hasUnknownCategories: false,
        unresolvedCategoryLabels: []
      },
      mythicPlusSlots: [
        {
          slot: 1,
          state: "UNLOCKED",
          threshold: 1,
          progress: 4,
          level: 10,
          rewardLabel: "+10"
        },
        {
          slot: 2,
          state: "UNLOCKED",
          threshold: 4,
          progress: 4,
          level: 8,
          rewardLabel: "+8"
        },
        {
          slot: 3,
          state: "LOCKED",
          threshold: 8,
          progress: 4,
          level: null,
          rewardLabel: null
        }
      ],
      raidSlots: [
        {
          slot: 1,
          state: "LOCKED",
          threshold: 2,
          progress: 0,
          level: 0,
          rewardLabel: null
        },
        {
          slot: 2,
          state: "LOCKED",
          threshold: 4,
          progress: 0,
          level: 0,
          rewardLabel: null
        },
        {
          slot: 3,
          state: "LOCKED",
          threshold: 6,
          progress: 0,
          level: 0,
          rewardLabel: null
        }
      ],
      worldSlots: [
        {
          slot: 1,
          state: "LOCKED",
          threshold: 2,
          progress: 0,
          level: 0,
          rewardLabel: null
        },
        {
          slot: 2,
          state: "LOCKED",
          threshold: 4,
          progress: 0,
          level: 0,
          rewardLabel: null
        },
        {
          slot: 3,
          state: "LOCKED",
          threshold: 8,
          progress: 0,
          level: 0,
          rewardLabel: null
        }
      ],
      highestKeyLevel: 10,
      mythicPlusRunCount: 4,
      mythicPlusRuns: [],
      action: "4 more M+ runs for Vault slot 3",
      vaultCaptured: true,
      vaultCurrent: true
    }
  ],
  summary: {
    characterCount: 2,
    attentionCount: 2,
    readyCount: 0
  }
};

vi.mock("../hooks/useVaultMythicPlus", () => ({
  useVaultMythicPlus: () => ({
    overview: mockOverview,
    isLoading: false,
    error: null
  })
}));

import { VaultMythicPlusPage } from "./VaultMythicPlusPage";

describe("VaultMythicPlusPage automatic gameplay", () => {
  it("shows automatic roster values and hides legacy Log run controls", () => {
    render(
      <MemoryRouter>
        <VaultMythicPlusPage />
      </MemoryRouter>
    );

    expect(screen.queryByText("Log run")).not.toBeInTheDocument();
    expect(screen.queryByText(/logged runs/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Automatic Great Vault and Mythic\+ progress/i)
    ).toBeInTheDocument();

    const tables = screen.getAllByRole("table");
    expect(tables[0]).toBeTruthy();
    expect(within(tables[0]!).getByText("Synblast")).toBeInTheDocument();
    expect(within(tables[0]!).getByText("6/9")).toBeInTheDocument();
    expect(within(tables[0]!).getAllByText("8/8").length).toBeGreaterThan(0);
    expect(within(tables[0]!).getByText("+15")).toBeInTheDocument();
    expect(screen.queryByText("Synbeast")).not.toBeInTheDocument();
  });

  it("shows selected character slot detail from automatic capture", () => {
    render(
      <MemoryRouter>
        <VaultMythicPlusPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Syndraco" }));

    expect(screen.getByText("SELECTED CHARACTER")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Syndraco" })).toBeInTheDocument();
    expect(
      screen.getAllByText(/4 more M\+ runs for Vault slot 3/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Mythic+").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Raid").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Delves").length).toBeGreaterThan(0);
  });
});
