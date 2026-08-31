import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { vaultMythicPlusPageMockOverview } from "./vaultMythicPlusPageTestHelpers";

vi.mock("../hooks/useVaultMythicPlus", () => ({
  useVaultMythicPlus: () => ({
    overview: vaultMythicPlusPageMockOverview,
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

  it("keeps UNKNOWN selected detail distinct from known zero", () => {
    render(
      <MemoryRouter>
        <VaultMythicPlusPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Synbloom" }));

    expect(screen.getByRole("heading", { name: "Synbloom" })).toBeInTheDocument();
    expect(
      screen.getByText(/Vault \? · M\+ \? slots · Raid \? slots · Delves \? slots/)
    ).toBeInTheDocument();
    expect(screen.getByText(/M\+ \? · Raid \? · Delves \?/)).toBeInTheDocument();
    expect(screen.queryByText(/Vault 0\/9/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Not captured this week")).toHaveLength(2);
    expect(screen.getAllByText("UNKNOWN").length).toBeGreaterThanOrEqual(9);
  });
});
