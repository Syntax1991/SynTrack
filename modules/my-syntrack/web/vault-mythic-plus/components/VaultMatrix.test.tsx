import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { VaultGameplayCharacter } from "../types/vaultMythicPlus.types";
import { VaultMatrix } from "./VaultMatrix";

function buildCharacter(
  overrides: Partial<VaultGameplayCharacter> = {}
): VaultGameplayCharacter {
  return {
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
    mythicPlusSlots: [],
    raidSlots: [],
    worldSlots: [],
    highestKeyLevel: 15,
    mythicPlusRunCount: 2,
    mythicPlusRuns: [],
    action: "2 World activities for Vault slot 1",
    vaultCaptured: true,
    vaultCurrent: true,
    ...overrides
  };
}

describe("VaultMatrix", () => {
  it("renders automatic gameplay columns without Log run", () => {
    const onSelect = vi.fn();

    render(
      <VaultMatrix
        characters={[
          buildCharacter(),
          buildCharacter({
            id: "char-2",
            name: "Synlight",
            highestKeyLevel: null,
            action: "Vault complete",
            vault: {
              state: "READY",
              completeCount: 9,
              applicableTotal: 9,
              knownUnlockedSlots: 9,
              maxSlots: 9,
              hasUnknownCategories: false,
              unresolvedCategoryLabels: []
            }
          })
        ]}
        onSelectCharacter={onSelect}
        selectedCharacterId="char-1"
      />
    );

    expect(screen.queryByText("Log run")).not.toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByText("M+")).toBeInTheDocument();
    expect(screen.getByText("6/9")).toBeInTheDocument();
    expect(screen.getByText("+15")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Synlight" }));
    expect(onSelect).toHaveBeenCalledWith("char-2");
  });
});
