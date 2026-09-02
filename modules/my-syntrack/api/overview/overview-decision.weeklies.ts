import { isWeeklyGameplayEnabled } from "../character-tracking/domain-applicability.js";
import type { CharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import type { WeekliesGameplaySignals } from "../weekly-checklist/weeklies-gameplay-signals.types.js";
import type { WeeklyGameplayCharacterView } from "../weekly-gameplay/weekly-gameplay.types.js";

/**
 * Canonical Weeklies Action language — same priority as Weeklies matrix UI.
 * Lifted for Overview composition; do not reimplement vault/M+/raid rules.
 */
export function deriveWeekliesGameplayAction(input: {
  trackingProfile: CharacterTrackingProfile;
  weeklyGameplay: WeeklyGameplayCharacterView | null;
  gameplaySignals: WeekliesGameplaySignals;
}): string | null {
  if (!isWeeklyGameplayEnabled(input.trackingProfile)) {
    return null;
  }

  return (
    input.weeklyGameplay?.mythicPlusAction ??
    input.weeklyGameplay?.raidAction ??
    input.weeklyGameplay?.delvesAction ??
    input.gameplaySignals.map.actionLabel ??
    input.gameplaySignals.meta.actionLabel ??
    null
  );
}
