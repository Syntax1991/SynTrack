import type {
  EmbellishmentOverviewState,
  GearOverviewState,
  ProfessionOverviewState,
  ProfessionWeeklyAggregate,
  ResourceItemView,
  ResourceOverviewState,
  TierOverviewState,
  VaultOverviewState,
  WeeklyOverviewState
} from "../types/overview.types";

export type CellToken = {
  symbol: string;
  tone:
    | "ready"
    | "attention"
    | "progress"
    | "unknown"
    | "not-tracked";
  title: string;
};

export function formatWeeklyToken(
  weekly: WeeklyOverviewState
): CellToken {
  if (weekly.total === 0) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Weekly tasks not tracked"
    };
  }

  if (weekly.state === "READY") {
    return {
      symbol: "✓",
      tone: "ready",
      title: `Weekly tasks complete (${weekly.completed}/${weekly.total})`
    };
  }

  return {
    symbol: `${weekly.completed}/${weekly.total}`,
    tone: "progress",
    title: `${weekly.completed} of ${weekly.total} weekly tasks complete`
  };
}

export function formatVaultToken(
  vault: VaultOverviewState
): CellToken {
  if (vault.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title:
        "Vault state unknown - no runs logged this period yet, or this character doesn't use the feature"
    };
  }

  return {
    symbol: `${vault.unlockedSlots}/${vault.slotsTotal}`,
    tone: vault.state === "READY" ? "ready" : "progress",
    title: `${vault.unlockedSlots} of ${vault.slotsTotal} Vault slots unlocked`
  };
}

export function formatProfessionToken(
  professions: ProfessionOverviewState
): CellToken {
  if (professions.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Professions not tracked"
    };
  }

  if (professions.state === "ATTENTION") {
    return {
      symbol: "!",
      tone: "attention",
      title:
        professions.issues[0] ??
        "Profession data needs attention"
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: "Professions tracked, no known issues"
  };
}

export function formatProfessionWeeklyAggregateToken(
  aggregate: ProfessionWeeklyAggregate,
  label: string
): CellToken {
  if (aggregate.applicableTotal === 0) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: `${label} not tracked`
    };
  }

  if (aggregate.incompleteCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "attention",
      title: `${label}: ${aggregate.incompleteCount} incomplete this week`
    };
  }

  if (aggregate.unknownCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "unknown",
      title: `${label}: ${aggregate.unknownCount} unknown`
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: `${label} complete this week`
  };
}

export function formatGearToken(
  gear: GearOverviewState
): CellToken {
  if (gear.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Gear not tracked"
    };
  }

  if (gear.state === "ATTENTION") {
    const title =
      gear.emptySocketCount > 0
        ? `${gear.emptySocketCount} empty ${
            gear.emptySocketCount === 1
              ? "socket"
              : "sockets"
          }`
        : "Gear needs attention";

    return {
      symbol: "!",
      tone: "attention",
      title
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: "Gear ready, no known issues"
  };
}

export function formatResourceCountToken(
  resources: ResourceOverviewState,
  key: string,
  label: string
): CellToken {
  const item: ResourceItemView | undefined = resources.items.find(
    (candidate) => candidate.key === key
  );

  const snapshot = item?.snapshot ?? null;

  if (!snapshot || snapshot.quantity === null) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: `${label} not tracked`
    };
  }

  if (snapshot.maxQuantity === null) {
    return {
      symbol: String(snapshot.quantity),
      tone: "unknown",
      title: `${label}: ${snapshot.quantity} (season maximum unknown)`
    };
  }

  return {
    symbol: `${snapshot.quantity}/${snapshot.maxQuantity}`,
    tone:
      snapshot.quantity >= snapshot.maxQuantity
        ? "ready"
        : "progress",
    title: `${label}: ${snapshot.quantity} of ${snapshot.maxQuantity} this season`
  };
}

export function formatItemLevelToken(
  gear: GearOverviewState
): CellToken {
  if (gear.itemLevel === null) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Item level not tracked"
    };
  }

  return {
    symbol: String(gear.itemLevel),
    tone: "ready",
    title: `Average item level ${gear.itemLevel}`
  };
}

export function formatTierToken(
  tier: TierOverviewState
): CellToken {
  if (tier.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Set/Tier not tracked"
    };
  }

  if (tier.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Set/Tier evidence incomplete"
    };
  }

  return {
    symbol: `${tier.equippedPieces}/${tier.targetPieces}`,
    tone: tier.state === "READY" ? "ready" : "progress",
    title: `${tier.equippedPieces} of ${tier.targetPieces} tier pieces equipped`
  };
}

export function formatEmbellishmentToken(
  embellishments: EmbellishmentOverviewState
): CellToken {
  if (embellishments.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Embellishments not tracked"
    };
  }

  if (embellishments.state === "UNKNOWN") {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Embellishment evidence incomplete"
    };
  }

  return {
    symbol: `${embellishments.equippedPieces}/${embellishments.targetPieces}`,
    tone:
      embellishments.state === "READY" ? "ready" : "progress",
    title: `${embellishments.equippedPieces} of ${embellishments.targetPieces} embellishments equipped`
  };
}
