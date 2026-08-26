import type { CellToken } from "../../../../../apps/web/src/shared/types/cellToken";
import type {
  MythicPlusVaultSlot,
  VaultCharacter
} from "../types/vaultMythicPlus.types";

function formatKeyLevel(
  keyLevel: number
): string {
  return keyLevel === 0
    ? "M0"
    : `+${keyLevel}`;
}

/*
 * No logged run data cannot distinguish "hasn't run a dungeon yet this
 * week" from "doesn't use this feature at all" - so zero runs renders
 * every slot as UNKNOWN ("?"), never a fake "0 done"/countdown. The
 * 1/4/8 threshold math itself (slot.threshold/unlocked/keyLevel) is
 * untouched and comes straight from the server.
 */
export function formatVaultSlotToken(
  character: VaultCharacter,
  slot: MythicPlusVaultSlot
): CellToken {
  if (character.runs.length === 0) {
    return {
      symbol: "?",
      tone: "unknown",
      title:
        "No Vault run history logged for this period"
    };
  }

  if (slot.unlocked) {
    return {
      symbol: `✓ ${formatKeyLevel(
        slot.keyLevel ?? 0
      )}`,
      tone: "ready",
      title: `Unlocked with ${slot.threshold} ${slot.threshold === 1 ? "run" : "runs"} logged`
    };
  }

  const remaining = Math.max(
    0,
    slot.threshold -
      character.runs.length
  );

  return {
    symbol: `${remaining} more`,
    tone: "progress",
    title: `Unlocks at ${slot.threshold} ${slot.threshold === 1 ? "run" : "runs"} (${remaining} more needed)`
  };
}

export function formatRunsLoggedToken(
  character: VaultCharacter
): CellToken {
  if (character.runs.length === 0) {
    return {
      symbol: "0",
      tone: "not-tracked",
      title:
        "No runs logged this period"
    };
  }

  return {
    symbol: String(
      character.runs.length
    ),
    tone: "progress",
    title: `${character.runs.length} ${character.runs.length === 1 ? "run" : "runs"} logged this period`
  };
}

export function formatHighestKeyToken(
  character: VaultCharacter
): CellToken {
  if (
    character.highestKeyLevel === null
  ) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title:
        "No runs logged this period"
    };
  }

  return {
    symbol: formatKeyLevel(
      character.highestKeyLevel
    ),
    tone: "ready",
    title: `Highest logged key this period: ${formatKeyLevel(character.highestKeyLevel)}`
  };
}
