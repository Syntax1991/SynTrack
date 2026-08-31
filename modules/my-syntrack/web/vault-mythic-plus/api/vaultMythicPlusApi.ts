import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { VaultMythicPlusResponse } from "../types/vaultMythicPlus.types";

export function getVaultMythicPlusOverview(): Promise<VaultMythicPlusResponse> {
  return apiRequest<VaultMythicPlusResponse>("/vault-mythic-plus");
}
