import type {
  AttentionItem,
  VaultOverviewState
} from "./overview.types.js";

export type OverviewVaultCharacterInput = {
  id: string;
  name: string;
  runs: { keyLevel: number }[];
  vaultSlots: {
    threshold: number;
    unlocked: boolean;
    keyLevel: number | null;
  }[];
  highestKeyLevel: number | null;
};

/*
 * Vault/M+ is owned by VaultMythicPlusService - this only reads its
 * already-computed vaultSlots (the real 1/4/8 threshold math, unchanged).
 *
 * Zero unlocked slots is deliberately UNKNOWN, never "0 done" or
 * "attention": the persisted WeeklyMythicPlusRun rows cannot distinguish
 * "hasn't run a dungeon yet this week" from "doesn't use this feature at
 * all" (no per-character vault-tracking flag exists) - claiming either
 * would be exactly the false-positive/false-negative this product
 * forbids.
 */
export function resolveVaultOverviewState(
  character: OverviewVaultCharacterInput
): {
  vault: VaultOverviewState;
  attentionItem: AttentionItem | null;
} {
  const slotsTotal =
    character.vaultSlots.length;

  const unlockedSlots =
    character.vaultSlots.filter(
      (slot) => slot.unlocked
    ).length;

  const vault: VaultOverviewState = {
    state:
      unlockedSlots === 0
        ? "UNKNOWN"
        : unlockedSlots >= slotsTotal
          ? "READY"
          : "IN_PROGRESS",
    unlockedSlots,
    slotsTotal,
    highestKeyLevel:
      character.highestKeyLevel,
    source: "MANUAL_LOG"
  };

  if (vault.state !== "IN_PROGRESS") {
    return {
      vault,
      attentionItem: null
    };
  }

  const nextThreshold =
    character.vaultSlots[
      unlockedSlots
    ]?.threshold ?? null;

  const runsNeeded =
    nextThreshold === null
      ? null
      : Math.max(
          nextThreshold -
            character.runs.length,
          1
        );

  return {
    vault,
    attentionItem: {
      id: `${character.id}:vault`,
      characterId: character.id,
      characterName: character.name,
      domain: "vault",
      severity: "this-week",
      label: "More Vault slots to unlock",
      detail:
        runsNeeded === null
          ? `${unlockedSlots}/${slotsTotal} slots unlocked`
          : `${runsNeeded} more ${runsNeeded === 1 ? "run" : "runs"} unlocks the next slot`,
      path: "/vault-mythic-plus"
    }
  };
}
