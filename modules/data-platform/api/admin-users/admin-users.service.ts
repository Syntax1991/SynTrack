import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { isAdminIdentity } from "./admin-allowlist.js";
import {
  RAIDER_ACCOUNT_ACTIVE,
  RAIDER_ACCOUNT_DISABLED,
  RAIDER_ACCOUNT_PENDING
} from "./admin-account-status.js";
import type { AdminUsersRepositoryContract } from "./admin-users.types.js";
import type {
  AdminUserAccountRecord,
  AdminUserListItem
} from "./admin-users.types.js";

function toListItem(
  record: AdminUserAccountRecord
): AdminUserListItem {
  return {
    id: record.id,
    battleTag: record.battleTag,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    lastSessionAt:
      record.lastSessionAt?.toISOString() ?? null,
    characterCount: record.characterCount,
    shareEnabled: record.shareEnabled,
    isAdmin: isAdminIdentity(record)
  };
}

export class AdminUsersService {
  constructor(
    private readonly repository: AdminUsersRepositoryContract
  ) {}

  async list(): Promise<AdminUserListItem[]> {
    const accounts = await this.repository.listAccounts();

    return accounts.map(toListItem);
  }

  async approve(id: string): Promise<AdminUserListItem[]> {
    const account = await this.requireAccount(id);

    if (account.status !== RAIDER_ACCOUNT_PENDING) {
      throw new AppError(409, "This account is not waiting for approval.");
    }

    await this.repository.setStatus(id, RAIDER_ACCOUNT_ACTIVE);

    return this.list();
  }

  async disable(id: string): Promise<AdminUserListItem[]> {
    const account = await this.requireMutableAccount(id);

    if (account.status !== RAIDER_ACCOUNT_ACTIVE) {
      throw new AppError(409, "Only an active account can be disabled.");
    }

    await this.repository.setStatus(id, RAIDER_ACCOUNT_DISABLED);
    await this.repository.deleteSessions(id);
    await this.repository.revokeDevices(id);
    await this.repository.disableShare(id);

    return this.list();
  }

  async enable(id: string): Promise<AdminUserListItem[]> {
    const account = await this.requireAccount(id);

    if (account.status !== RAIDER_ACCOUNT_DISABLED) {
      throw new AppError(409, "Only a disabled account can be re-enabled.");
    }

    await this.repository.setStatus(id, RAIDER_ACCOUNT_ACTIVE);

    return this.list();
  }

  async revokeShare(id: string): Promise<AdminUserListItem[]> {
    await this.requireMutableAccount(id);
    await this.repository.disableShare(id);

    return this.list();
  }

  async remove(
    id: string,
    confirmBattleTag: string
  ): Promise<AdminUserListItem[]> {
    const account = await this.requireMutableAccount(id);
    const expected = (account.battleTag ?? "").trim();
    const provided = confirmBattleTag.trim();

    if (expected === "" || provided !== expected) {
      throw new AppError(
        400,
        "Type the BattleTag to confirm deleting this account."
      );
    }

    await this.repository.deleteAccount(id);

    return this.list();
  }

  private async requireAccount(id: string) {
    const account = await this.repository.findAccountById(id);

    if (!account) {
      throw new AppError(404, "Account not found.");
    }

    return account;
  }

  private async requireMutableAccount(id: string) {
    const account = await this.requireAccount(id);

    if (isAdminIdentity(account)) {
      throw new AppError(
        403,
        "The operator allowlist account cannot be changed this way."
      );
    }

    return account;
  }
}
