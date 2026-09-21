import { describe, expect, it, vi } from "vitest";
import {
  RAIDER_ACCOUNT_ACTIVE,
  RAIDER_ACCOUNT_DISABLED,
  RAIDER_ACCOUNT_PENDING
} from "./admin-account-status.js";
import { AdminUsersService } from "./admin-users.service.js";
import type { AdminUserAccountRecord } from "./admin-users.types.js";

vi.mock("../../../../apps/api/src/config/env.js", () => ({
  env: {
    SYNTRACK_ADMIN_BATTLE_NET_ACCOUNT_IDS: "admin-blizz",
    SYNTRACK_ADMIN_BATTLE_TAGS: "Admin#1"
  }
}));

function record(
  overrides: Partial<AdminUserAccountRecord> = {}
): AdminUserAccountRecord {
  return {
    id: "user-1",
    battleNetAccountId: "blizz-2",
    battleTag: "Guildie#2",
    status: RAIDER_ACCOUNT_PENDING,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    characterCount: 3,
    shareEnabled: true,
    lastSessionAt: null,
    ...overrides
  };
}

function createService(rows: AdminUserAccountRecord[]) {
  const accounts = rows.map((row) => ({ ...row }));

  const repository = {
    listAccounts: vi.fn(async () => accounts.map((row) => ({ ...row }))),
    findAccountById: vi.fn(
      async (id: string) => accounts.find((row) => row.id === id) ?? null
    ),
    setStatus: vi.fn(async (id: string, status: string) => {
      const account = accounts.find((row) => row.id === id);
      if (account) {
        account.status = status;
      }
    }),
    deleteSessions: vi.fn(async () => undefined),
    revokeDevices: vi.fn(async () => undefined),
    disableShare: vi.fn(async (id: string) => {
      const account = accounts.find((row) => row.id === id);
      if (account) {
        account.shareEnabled = false;
      }
    }),
    deleteAccount: vi.fn(async (id: string) => {
      const index = accounts.findIndex((row) => row.id === id);
      if (index >= 0) {
        accounts.splice(index, 1);
      }
    })
  };

  return {
    service: new AdminUsersService(repository),
    repository,
    accounts
  };
}

describe("AdminUsersService", () => {
  it("lists metadata without tokens and marks allowlisted accounts as admin", async () => {
    const { service } = createService([
      record({
        id: "admin",
        battleNetAccountId: "admin-blizz",
        battleTag: "Admin#1",
        status: RAIDER_ACCOUNT_ACTIVE
      }),
      record()
    ]);

    const listed = await service.list();

    expect(listed.map((row) => [row.id, row.isAdmin, row.shareEnabled])).toEqual(
      [
        ["admin", true, true],
        ["user-1", false, true]
      ]
    );
    expect(JSON.stringify(listed)).not.toMatch(/accessToken/u);
  });

  it("approves a pending account", async () => {
    const { service, accounts } = createService([record()]);

    await service.approve("user-1");

    expect(accounts[0]?.status).toBe(RAIDER_ACCOUNT_ACTIVE);
  });

  it("refuses to disable or delete an allowlisted admin", async () => {
    const { service, repository } = createService([
      record({
        id: "admin",
        battleNetAccountId: "admin-blizz",
        battleTag: "Admin#1",
        status: RAIDER_ACCOUNT_ACTIVE
      })
    ]);

    await expect(service.disable("admin")).rejects.toThrow(
      /allowlist/u
    );
    await expect(
      service.remove("admin", "Admin#1")
    ).rejects.toThrow(/allowlist/u);
    expect(repository.deleteAccount).not.toHaveBeenCalled();
  });

  it("disables an active user, revokes devices, and stops sharing", async () => {
    const { service, repository, accounts } = createService([
      record({ status: RAIDER_ACCOUNT_ACTIVE })
    ]);

    await service.disable("user-1");

    expect(accounts[0]?.status).toBe(RAIDER_ACCOUNT_DISABLED);
    expect(repository.deleteSessions).toHaveBeenCalledWith("user-1");
    expect(repository.revokeDevices).toHaveBeenCalledWith("user-1");
    expect(repository.disableShare).toHaveBeenCalledWith("user-1");
    expect(accounts[0]?.shareEnabled).toBe(false);
  });

  it("deletes owned data only after the BattleTag is typed", async () => {
    const { service, repository } = createService([
      record({ status: RAIDER_ACCOUNT_ACTIVE })
    ]);

    await expect(service.remove("user-1", "Wrong#1")).rejects.toThrow(
      /BattleTag/u
    );
    expect(repository.deleteAccount).not.toHaveBeenCalled();

    await service.remove("user-1", "Guildie#2");

    expect(repository.deleteAccount).toHaveBeenCalledWith("user-1");
  });

  it("re-enables a disabled account and can stop sharing", async () => {
    const { service, accounts } = createService([
      record({ status: RAIDER_ACCOUNT_DISABLED, shareEnabled: true })
    ]);

    await service.enable("user-1");
    expect(accounts[0]?.status).toBe(RAIDER_ACCOUNT_ACTIVE);

    await service.revokeShare("user-1");
    expect(accounts[0]?.shareEnabled).toBe(false);
  });
});
