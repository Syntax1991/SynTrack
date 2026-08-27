import type {
  EmbellishmentOverviewState,
  GearOverviewState,
  ProfessionOverviewState,
  ResourceOverviewState,
  TierOverviewState,
  VaultOverviewState,
  WeeklyOverviewState
} from "../types/overview.types";

/*
 * A compact matrix token: a short symbol/number (never a full pill
 * label repeated in every row), a tone driving restrained color, and a
 * title/tooltip carrying the full explanation for screen readers and
 * hover. READY/UNKNOWN/NOT_TRACKED/ATTENTION are visually and
 * semantically distinct tokens - never blurred into each other.
 */
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
    tone:
      vault.state === "READY"
        ? "ready"
        : "progress",
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
    const parts: string[] = [];

    if (gear.missingEnchantCount > 0) {
      parts.push(
        `${gear.missingEnchantCount} missing ${gear.missingEnchantCount === 1 ? "enchant" : "enchants"}`
      );
    }

    if (gear.emptySocketCount > 0) {
      parts.push(
        `${gear.emptySocketCount} empty ${gear.emptySocketCount === 1 ? "socket" : "sockets"}`
      );
    }

    return {
      symbol: "!",
      tone: "attention",
      title:
        parts.join(", ") ||
        "Gear needs attention"
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: "Gear ready, no known issues"
  };
}

export function formatResourceToken(
  resources: ResourceOverviewState
): CellToken {
  if (resources.state === "NOT_TRACKED") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Resources not tracked"
    };
  }

  if (resources.state === "ATTENTION") {
    return {
      symbol: String(
        resources.attentionCount
      ),
      tone: "attention",
      title: `${resources.attentionCount} ${resources.attentionCount === 1 ? "resource" : "resources"} not complete this week`
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: "Resources complete this week"
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
  void tier;

  return {
    symbol: "—",
    tone: "not-tracked",
    title:
      "Set/Tier not tracked - no data source exists yet"
  };
}

export function formatEmbellishmentToken(
  embellishments: EmbellishmentOverviewState
): CellToken {
  void embellishments;

  return {
    symbol: "—",
    tone: "not-tracked",
    title:
      "Embellishments not tracked - no data source exists yet"
  };
}
