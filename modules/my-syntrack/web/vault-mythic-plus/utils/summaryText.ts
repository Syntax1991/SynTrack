import type { VaultMythicPlusResponse } from "../types/vaultMythicPlus.types";

function formatResetLabel(
  endsAt: string
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(new Date(endsAt));
}

/*
 * Replaces the four large KPI cards with one compact line. Wording is
 * deliberately a count of confirmed activity ("logged runs"/"tracked
 * Vaults"), never an authoritative "0 done" claim about characters
 * with no logged runs.
 */
export function formatVaultSummaryText(
  overview: VaultMythicPlusResponse
): string {
  return `${overview.summary.runCount} logged runs · ${overview.summary.charactersWithVault} tracked Vaults · Reset ${formatResetLabel(overview.period.endsAt)}`;
}
