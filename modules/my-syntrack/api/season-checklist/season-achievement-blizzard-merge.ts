import type { ResolvedTrackerDefinition } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import {
  CHARACTER_SCOPE_PROVEN_BLIZZARD_ACHIEVEMENT_IDS,
  mergeAchievementCompletion
} from "../character-external-sync/character-achievement-authority.service.js";
import { booleanValue } from "./season-checklist.evidence.js";
import { primarySeasonEvidenceForGoal } from "./season-evidence-catalog.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

/*
 * Phase E read-path integration: injects Blizzard-confirmed achievement
 * evidence alongside the addon's own tracker state WITHOUT teaching
 * deriveBooleanEvidenceGoal/deriveRaidGoal/deriveWarbandBooleanGoal
 * anything about Blizzard - they only ever see the same
 * ResolvedTrackerDefinition / SeasonGoalSignal[] shapes they already
 * consumed before this phase (see season-checklist.service.ts /
 * season-checklist.warband.ts for where these are called).
 */

/**
 * CHARACTER-scoped merge: gated by CHARACTER_SCOPE_PROVEN_BLIZZARD_ACHIEVEMENT_IDS
 * FIRST - an achievement id not on that allowlist returns the addon-only
 * `resolved` completely unchanged, regardless of what Blizzard reports,
 * because response shape/structure alone never proves character-specific
 * semantics (see the allowlist's doc comment for the live evidence this
 * corrects). For an allowlisted id, only synthesizes a modified resolved
 * tracker when the merge actually changes the outcome - otherwise returns
 * the original object unchanged so callers never see a spurious
 * "BLIZZARD" source label when nothing actually came from Blizzard.
 */
export function withAchievementBlizzardMerge(
  resolved: ResolvedTrackerDefinition | null,
  achievementId: number,
  blizzardEarnedByCharacter: Map<number, boolean>
): ResolvedTrackerDefinition | null {
  if (!CHARACTER_SCOPE_PROVEN_BLIZZARD_ACHIEVEMENT_IDS.has(achievementId)) {
    return resolved;
  }

  const addonValue = booleanValue(resolved);
  const blizzardValue = blizzardEarnedByCharacter.get(achievementId) ?? null;
  const merged = mergeAchievementCompletion(addonValue, blizzardValue);

  if (merged === addonValue || !resolved) {
    return resolved;
  }

  return {
    definition: resolved.definition,
    state: {
      trackerDefinitionId: resolved.definition.id,
      characterId: resolved.state?.characterId ?? "",
      periodKey: resolved.state?.periodKey ?? "ALWAYS",
      state: "RECORDED",
      source: "BLIZZARD",
      value: { valueType: "BOOLEAN", boolean: merged as boolean }
    }
  };
}

/**
 * Convenience wrapper for CHARACTER-scoped goals: looks up the goal's
 * catalog evidence (trackerKey + achievementId) and applies the merge in
 * one call, keeping season-checklist.service.ts's per-character block
 * short.
 */
export function resolveMergedCharacterEvidence(
  goalKey: string,
  resolveEvidence: (trackerKey: string) => ResolvedTrackerDefinition | null,
  blizzardEarnedByCharacter: Map<number, boolean>
): ResolvedTrackerDefinition | null {
  const evidence = primarySeasonEvidenceForGoal(goalKey);

  return withAchievementBlizzardMerge(
    resolveEvidence(evidence?.trackerKey ?? ""),
    evidence?.externalId ?? -1,
    blizzardEarnedByCharacter
  );
}

/**
 * WARBAND aggregation: one synthetic signal representing "Blizzard
 * confirmed this achievement on AT LEAST ONE tracked character" - added
 * alongside the existing per-character addon signals so
 * deriveWarbandBooleanGoal's existing `signals.some(state==="COMPLETE")`
 * OR-aggregation picks it up for free, with zero changes to that
 * function. Returns null (contribute nothing) when no character has
 * ever produced a Blizzard ACHIEVEMENTS snapshot at all, rather than
 * asserting a fabricated UNKNOWN/INCOMPLETE signal that could suppress a
 * real addon-confirmed COMPLETE elsewhere in the array.
 */
export function blizzardWarbandAchievementSignal(
  achievementId: number,
  blizzardEarnedByCharacterMaps: Map<string, Map<number, boolean>>,
  goalKey: string
): SeasonGoalSignal | null {
  let sawAnyEvidence = false;
  let earnedSomewhere = false;

  for (const map of blizzardEarnedByCharacterMaps.values()) {
    const value = map.get(achievementId);

    if (value === undefined) {
      continue;
    }

    sawAnyEvidence = true;

    if (value === true) {
      earnedSomewhere = true;
      break;
    }
  }

  if (!sawAnyEvidence) {
    return null;
  }

  return {
    key: goalKey,
    title: "",
    state: earnedSomewhere ? "COMPLETE" : "INCOMPLETE",
    label: "",
    detail: "",
    actionLabel: null
  };
}
