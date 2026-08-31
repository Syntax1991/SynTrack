import type { VaultMythicPlusResponse } from "../types/vaultMythicPlus.types";
import { formatResetCountdown } from "../../overview/utils/resetContext";

export function formatVaultSummaryText(
  overview: VaultMythicPlusResponse,
  now = new Date()
): string {
  return `${overview.summary.characterCount} gameplay · ${overview.summary.attentionCount} attention · ${overview.summary.readyCount} ready · ${formatResetCountdown(overview.period.endsAt, now)} · Automatic Great Vault from synced WoW data`;
}
