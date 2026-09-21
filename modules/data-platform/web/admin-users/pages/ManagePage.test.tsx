import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ManagePage } from "./ManagePage";

const getRaiderSessionStatus = vi.fn();

vi.mock("../../raider-auth/api/raiderAuthApi", () => ({
  getRaiderSessionStatus: () => getRaiderSessionStatus()
}));

vi.mock("../components/AdminUsersPanel", () => ({
  AdminUsersPanel: () => <div>Users admin panel</div>
}));

function renderManage() {
  return render(
    <MemoryRouter initialEntries={["/manage"]}>
      <Routes>
        <Route element={<ManagePage />} path="/manage" />
        <Route element={<div>Home</div>} path="/" />
      </Routes>
    </MemoryRouter>
  );
}

describe("ManagePage", () => {
  beforeEach(() => {
    getRaiderSessionStatus.mockReset();
  });

  it("redirects a non-operator away from /manage", async () => {
    getRaiderSessionStatus.mockResolvedValue({
      battleTag: "AzureLion#210727",
      expiresAt: "2026-12-31T00:00:00.000Z",
      isAdmin: false
    });

    renderManage();

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Users admin panel")).not.toBeInTheDocument();
  });

  it("shows user management for an operator", async () => {
    getRaiderSessionStatus.mockResolvedValue({
      battleTag: "Syntax#21715",
      expiresAt: "2026-12-31T00:00:00.000Z",
      isAdmin: true
    });

    renderManage();

    expect(
      await screen.findByRole("heading", { name: "Manage" })
    ).toBeInTheDocument();
    expect(screen.getByText("Users admin panel")).toBeInTheDocument();
  });
});
