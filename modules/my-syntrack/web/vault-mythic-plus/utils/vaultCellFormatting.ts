import type {
  VaultDomainProgress,
  VaultGameplayCharacter,
  VaultSlotDetail
} from "../types/vaultMythicPlus.types";

export function formatDomainFraction(domain: VaultDomainProgress): {
  symbol: string;
  tone: "ready" | "attention" | "unknown" | "not-tracked";
  title: string;
} {
  if (domain.state === "UNKNOWN" || domain.applicableTotal <= 0) {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Progress unresolved"
    };
  }

  const symbol = `${domain.completeCount}/${domain.applicableTotal}`;

  return {
    symbol,
    tone: domain.state === "READY" ? "ready" : "attention",
    title: symbol
  };
}

/** Progress fraction for selected-character summary; never collapses UNKNOWN to 0. */
export function formatDomainProgressText(domain: VaultDomainProgress): string {
  return formatDomainFraction(domain).symbol;
}

/** Slot unlock fraction for selected-character summary; UNKNOWN stays "?". */
export function formatDomainSlotUnlockText(domain: VaultDomainProgress): string {
  if (domain.state === "UNKNOWN" || domain.maxSlots <= 0) {
    return "?";
  }

  return `${domain.knownUnlockedSlots}/${domain.maxSlots}`;
}

export function formatHighestKeyToken(character: VaultGameplayCharacter): {
  symbol: string;
  tone: "ready" | "attention" | "unknown" | "not-tracked";
  title: string;
} {
  if (character.highestKeyLevel === null) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "No automatic M+ history this week"
    };
  }

  return {
    symbol: `+${character.highestKeyLevel}`,
    tone: "ready",
    title: `Highest completed key +${character.highestKeyLevel}`
  };
}

export function formatSlotToken(slot: VaultSlotDetail): {
  symbol: string;
  tone: "ready" | "attention" | "unknown" | "not-tracked";
  title: string;
} {
  if (slot.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Slot unresolved"
    };
  }

  if (slot.state === "UNLOCKED") {
    return {
      symbol: slot.rewardLabel ?? "Unlocked",
      tone: "ready",
      title: slot.rewardLabel
        ? `Unlocked · ${slot.rewardLabel}`
        : `Unlocked · ${slot.progress}/${slot.threshold}`
    };
  }

  return {
    symbol:
      slot.progress !== null && slot.threshold !== null
        ? `${slot.progress}/${slot.threshold}`
        : "Locked",
    tone: "attention",
    title:
      slot.progress !== null && slot.threshold !== null
        ? `Locked · ${slot.progress}/${slot.threshold}`
        : "Locked"
  };
}
