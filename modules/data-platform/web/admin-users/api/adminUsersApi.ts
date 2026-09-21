import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { AdminUserListItem } from "../types/adminUsers.types";

export function listAdminUsers(): Promise<AdminUserListItem[]> {
  return apiRequest<AdminUserListItem[]>("/admin/users");
}

export function approveAdminUser(
  id: string
): Promise<AdminUserListItem[]> {
  return apiRequest<AdminUserListItem[]>(
    `/admin/users/${id}/approve`,
    { method: "POST" }
  );
}

export function disableAdminUser(
  id: string
): Promise<AdminUserListItem[]> {
  return apiRequest<AdminUserListItem[]>(
    `/admin/users/${id}/disable`,
    { method: "POST" }
  );
}

export function enableAdminUser(
  id: string
): Promise<AdminUserListItem[]> {
  return apiRequest<AdminUserListItem[]>(
    `/admin/users/${id}/enable`,
    { method: "POST" }
  );
}

export function revokeAdminUserShare(
  id: string
): Promise<AdminUserListItem[]> {
  return apiRequest<AdminUserListItem[]>(
    `/admin/users/${id}/revoke-share`,
    { method: "POST" }
  );
}

export function deleteAdminUser(
  id: string,
  confirmBattleTag: string
): Promise<AdminUserListItem[]> {
  return apiRequest<AdminUserListItem[]>(
    `/admin/users/${id}`,
    {
      method: "DELETE",
      body: JSON.stringify({ confirmBattleTag })
    }
  );
}
