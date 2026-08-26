import type {
  EmbellishmentOverviewState,
  GearOverviewState,
  ProfessionOverviewState,
  TierOverviewState,
  VaultOverviewState,
  WeeklyOverviewState
} from "../types/overview.types";

export function formatWeeklyCell(
  weekly: WeeklyOverviewState
) {
  return {
    state: weekly.state,
    detail:
      weekly.total === 0
        ? undefined
        : `${weekly.completed}/${weekly.total}`
  };
}

export function formatVaultCell(
  vault: VaultOverviewState
) {
  if (vault.state === "UNKNOWN") {
    return {
      state: vault.state,
      detail: "No runs logged"
    };
  }

  return {
    state: vault.state,
    detail: `${vault.unlockedSlots}/${vault.slotsTotal}`
  };
}

export function formatProfessionCell(
  professions: ProfessionOverviewState
) {
  if (
    professions.state ===
    "ATTENTION"
  ) {
    return {
      state: professions.state,
      detail: `${professions.issueCount} ${professions.issueCount === 1 ? "issue" : "issues"}`
    };
  }

  return {
    state: professions.state,
    detail: undefined
  };
}

export function formatGearCell(
  gear: GearOverviewState
) {
  if (gear.state === "ATTENTION") {
    const issueCount =
      gear.missingEnchantCount +
      gear.emptySocketCount;

    return {
      state: gear.state,
      detail: `${issueCount} ${issueCount === 1 ? "issue" : "issues"}`
    };
  }

  return {
    state: gear.state,
    detail: undefined
  };
}

export function formatItemLevelCell(
  gear: GearOverviewState
) {
  return {
    state:
      gear.itemLevel === null
        ? ("NOT_TRACKED" as const)
        : ("READY" as const),
    detail:
      gear.itemLevel === null
        ? undefined
        : String(gear.itemLevel)
  };
}

export function formatTierCell(
  tier: TierOverviewState
) {
  return {
    state: tier.state,
    detail: undefined
  };
}

export function formatEmbellishmentsCell(
  embellishments: EmbellishmentOverviewState
) {
  return {
    state: embellishments.state,
    detail: undefined
  };
}
