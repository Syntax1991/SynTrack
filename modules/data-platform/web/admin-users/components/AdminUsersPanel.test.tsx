import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsersPanel } from "./AdminUsersPanel";
import type { AdminUserListItem } from "../types/adminUsers.types";

const listAdminUsers = vi.fn();
const approveAdminUser = vi.fn();
const deleteAdminUser = vi.fn();

vi.mock("../api/adminUsersApi", () => ({
  listAdminUsers: () => listAdminUsers(),
  approveAdminUser: (id: string) => approveAdminUser(id),
  disableAdminUser: vi.fn(),
  enableAdminUser: vi.fn(),
  revokeAdminUserShare: vi.fn(),
  deleteAdminUser: (id: string, confirmBattleTag: string) =>
    deleteAdminUser(id, confirmBattleTag)
}));

const pending: AdminUserListItem = {
  id: "user-1",
  battleTag: "Guildie#2",
  status: "PENDING_APPROVAL",
  createdAt: "2026-09-01T00:00:00.000Z",
  lastSessionAt: null,
  characterCount: 0,
  shareEnabled: false,
  isAdmin: false
};

const operator: AdminUserListItem = {
  id: "admin",
  battleTag: "Syntax#21715",
  status: "ACTIVE",
  createdAt: "2026-08-01T00:00:00.000Z",
  lastSessionAt: "2026-09-09T00:00:00.000Z",
  characterCount: 22,
  shareEnabled: true,
  isAdmin: true
};

describe("AdminUsersPanel", () => {
  beforeEach(() => {
    listAdminUsers.mockReset();
    approveAdminUser.mockReset();
    deleteAdminUser.mockReset();
  });

  it("lists accounts and can approve a pending user", async () => {
    listAdminUsers.mockResolvedValue([operator, pending]);
    approveAdminUser.mockResolvedValue([
      operator,
      { ...pending, status: "ACTIVE" }
    ]);

    render(<AdminUsersPanel />);

    expect(await screen.findByText(/Guildie#2/u)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disable" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(approveAdminUser).toHaveBeenCalledWith("user-1");
    });
  });

  it("requires typing the BattleTag before delete", async () => {
    listAdminUsers.mockResolvedValue([pending]);
    deleteAdminUser.mockResolvedValue([]);

    render(<AdminUsersPanel />);

    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    fireEvent.change(
      screen.getByLabelText("Type BattleTag to delete"),
      { target: { value: "Guildie#2" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(deleteAdminUser).toHaveBeenCalledWith("user-1", "Guildie#2");
    });
  });
});
