import { useCallback, useEffect, useState } from "react";
import {
  approveAdminUser,
  deleteAdminUser,
  disableAdminUser,
  enableAdminUser,
  listAdminUsers,
  revokeAdminUserShare
} from "../api/adminUsersApi";
import type { AdminUserListItem } from "../types/adminUsers.types";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setUsers(await listAdminUsers());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Users could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(
    action: () => Promise<AdminUserListItem[]>
  ) {
    setError(null);

    try {
      setUsers(await action());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The account action failed."
      );
    }
  }

  return {
    users,
    isLoading,
    error,
    approve: (id: string) => run(() => approveAdminUser(id)),
    disable: (id: string) => run(() => disableAdminUser(id)),
    enable: (id: string) => run(() => enableAdminUser(id)),
    revokeShare: (id: string) => run(() => revokeAdminUserShare(id)),
    remove: (id: string, confirmBattleTag: string) =>
      run(() => deleteAdminUser(id, confirmBattleTag))
  };
}
