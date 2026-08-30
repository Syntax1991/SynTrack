import type { CharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import {
  isWeeklyGameplayDomainEnabled,
  resolveWeeklyGameplayDomainApplicability,
  type DomainApplicability,
  type WeeklyGameplayDomain
} from "../character-tracking/domain-applicability.js";
import type {
  AttentionItem,
  ProfessionWeeklyOverviewState,
  VaultOverviewState
} from "./overview.types.js";
import type {
  WeeklySummaryDomainDetail,
  WeeklySummaryOverviewState
} from "./overview-triage.types.js";
import type { OverviewDomainState } from "./overview.types.js";

export type WeeklySummaryInput = {
  characterId: string;
  characterName: string;
  trackingProfile?: CharacterTrackingProfile;
  vault: VaultOverviewState;
  professionWeekly: ProfessionWeeklyOverviewState;
  /*
   * Activity domains not yet automatically captured - always UNKNOWN
   * for now (never fabricated incomplete).
   */
  mythicPlusState?: OverviewDomainState;
  raidState?: OverviewDomainState;
  delvesState?: OverviewDomainState;
};

function aggregateToDetail(
  label: string,
  complete: number,
  incomplete: number,
  unknown: number,
  applicable: number
): WeeklySummaryDomainDetail {
  if (applicable === 0) {
    return {
      key: label,
      label,
      state: "NOT_TRACKED",
      completeCount: 0,
      applicableTotal: 0,
      unknownCount: 0
    };
  }

  if (incomplete > 0) {
    return {
      key: label,
      label,
      state: "ATTENTION",
      completeCount: complete,
      applicableTotal: applicable,
      unknownCount: unknown
    };
  }

  if (unknown > 0) {
    return {
      key: label,
      label,
      state: "UNKNOWN",
      completeCount: complete,
      applicableTotal: applicable,
      unknownCount: unknown
    };
  }

  return {
    key: label,
    label,
    state: "READY",
    completeCount: complete,
    applicableTotal: applicable,
    unknownCount: 0
  };
}

function activityPlaceholder(
  key: string,
  label: string,
  state: OverviewDomainState = "UNKNOWN",
  applicability: DomainApplicability = "ENABLED"
): WeeklySummaryDomainDetail {
  return {
    key,
    label,
    state,
    completeCount: 0,
    applicableTotal: state === "NOT_TRACKED" ? 0 : 1,
    unknownCount: state === "UNKNOWN" ? 1 : 0,
    applicability
  };
}

function gameplayDomainDetail(
  key: WeeklyGameplayDomain,
  label: string,
  profile: CharacterTrackingProfile,
  capturedState?: OverviewDomainState
): WeeklySummaryDomainDetail {
  const applicability = resolveWeeklyGameplayDomainApplicability(
    profile,
    key
  );

  if (applicability === "DISABLED_BY_PROFILE") {
    return activityPlaceholder(key, label, "NOT_TRACKED", applicability);
  }

  return activityPlaceholder(
    key,
    label,
    capturedState ?? "UNKNOWN",
    applicability
  );
}

/*
 * Overview WEEKLIES cell - one triage summary of recurring reset-aware
 * work. Excludes Gear and permanent Knowledge Treasures. Manual
 * checklist progress is intentionally not used (replaced by automatic
 * / placeholder activity domains).
 */
export function resolveWeeklySummaryOverviewState(
  input: WeeklySummaryInput
): {
  weeklySummary: WeeklySummaryOverviewState;
  weeklyAction: AttentionItem | null;
} {
  const { vault, professionWeekly } = input;
  const profile = input.trackingProfile ?? "FULL";

  const vaultDetail: WeeklySummaryDomainDetail =
    !isWeeklyGameplayDomainEnabled(profile, "vault")
      ? gameplayDomainDetail("vault", "Vault", profile)
      : vault.state === "UNKNOWN"
        ? gameplayDomainDetail("vault", "Vault", profile, "UNKNOWN")
        : vault.state === "NOT_TRACKED"
          ? gameplayDomainDetail("vault", "Vault", profile, "NOT_TRACKED")
          : {
              key: "vault",
              label: "Vault",
              state: vault.state,
              completeCount: vault.unlockedSlots,
              applicableTotal: vault.slotsTotal,
              unknownCount: 0,
              applicability: "ENABLED"
            };

  const domains: WeeklySummaryDomainDetail[] = [
    vaultDetail,
    gameplayDomainDetail(
      "mythic-plus",
      "M+",
      profile,
      input.mythicPlusState
    ),
    gameplayDomainDetail("raid", "Raid", profile, input.raidState),
    gameplayDomainDetail(
      "delves",
      "Delves",
      profile,
      input.delvesState
    ),
    aggregateToDetail(
      "Quest",
      professionWeekly.quest.completeCount,
      professionWeekly.quest.incompleteCount,
      professionWeekly.quest.unknownCount,
      professionWeekly.quest.applicableTotal
    ),
    aggregateToDetail(
      "Treatise",
      professionWeekly.treatise.completeCount,
      professionWeekly.treatise.incompleteCount,
      professionWeekly.treatise.unknownCount,
      professionWeekly.treatise.applicableTotal
    ),
    aggregateToDetail(
      "Drops",
      professionWeekly.drops.completeCount,
      professionWeekly.drops.incompleteCount,
      professionWeekly.drops.unknownCount,
      professionWeekly.drops.applicableTotal
    )
  ];

  const tracked = domains.filter(
    (domain) => domain.state !== "NOT_TRACKED"
  );

  let completedKnown = 0;
  let applicableKnown = 0;
  let unknownCount = 0;
  let incompleteKnown = 0;

  for (const domain of tracked) {
    if (domain.state === "UNKNOWN") {
      unknownCount += 1;
      continue;
    }

    applicableKnown += domain.applicableTotal;
    completedKnown += domain.completeCount;

    if (domain.state === "ATTENTION" || domain.state === "IN_PROGRESS") {
      incompleteKnown += Math.max(
        0,
        domain.applicableTotal - domain.completeCount
      );
    }
  }

  const state: OverviewDomainState =
    tracked.length === 0
      ? "NOT_TRACKED"
      : incompleteKnown > 0
        ? "ATTENTION"
        : unknownCount > 0
          ? "UNKNOWN"
          : "READY";

  const weeklySummary: WeeklySummaryOverviewState = {
    state,
    completedKnown,
    applicableKnown,
    unknownCount,
    domains
  };

  const weeklyAction = resolveWeeklyOnlyAction(input, domains);

  return { weeklySummary, weeklyAction };
}

function resolveWeeklyOnlyAction(
  input: WeeklySummaryInput,
  domains: WeeklySummaryDomainDetail[]
): AttentionItem | null {
  const incompleteProfession =
    input.professionWeekly.professions.flatMap((profession) => {
      const labels: string[] = [];

      if (profession.quest?.state === "INCOMPLETE") {
        labels.push(`${profession.name} Quest`);
      }

      if (profession.treatise?.state === "INCOMPLETE") {
        labels.push(`${profession.name} Treatise`);
      }

      if (profession.drops?.state === "INCOMPLETE") {
        const remaining =
          (profession.drops.maxValue ?? 0) -
          (profession.drops.currentValue ?? 0);
        labels.push(
          remaining > 0
            ? `${remaining} ${profession.name} Knowledge Drop${
                remaining === 1 ? "" : "s"
              }`
            : `${profession.name} Knowledge Drops`
        );
      }

      return labels;
    });

  if (incompleteProfession.length > 0) {
    const label =
      incompleteProfession.length === 1
        ? `${incompleteProfession[0]} remaining`
        : `${incompleteProfession[0]} remaining`;

    return {
      id: `${input.characterId}:weekly-action`,
      characterId: input.characterId,
      characterName: input.characterName,
      domain: "profession-weekly",
      severity: "this-week",
      label,
      detail: incompleteProfession.join(", "),
      path: `/weekly-checklist`
    };
  }

  const vault = domains.find((domain) => domain.key === "vault");
  const profile = input.trackingProfile ?? "FULL";

  if (
    isWeeklyGameplayDomainEnabled(profile, "vault") &&
    vault &&
    vault.state === "ATTENTION" &&
    vault.applicableTotal > vault.completeCount
  ) {
    return {
      id: `${input.characterId}:weekly-action`,
      characterId: input.characterId,
      characterName: input.characterName,
      domain: "vault",
      severity: "this-week",
      label: `Vault ${vault.completeCount}/${vault.applicableTotal}`,
      detail: null,
      path: `/vault-mythic-plus`
    };
  }

  return null;
}
