import type { CharacterTrackingProfile } from "./character-tracking-profile.js";

export type WeeklyGameplayDomain =
  | "vault"
  | "mythic-plus"
  | "raid"
  | "delves";

/*
 * Why a domain is enabled, suppressed, or irrelevant — distinct from
 * capture/UNKNOWN state. UI may render DISABLED_BY_PROFILE and
 * NOT_APPLICABLE both as "—" while keeping the reason for tooltips.
 */
export type DomainApplicability =
  | "ENABLED"
  | "DISABLED_BY_PROFILE"
  | "NOT_APPLICABLE";

export function resolveWeeklyGameplayDomainApplicability(
  profile: CharacterTrackingProfile,
  _domain: WeeklyGameplayDomain
): DomainApplicability {
  if (profile === "FULL" || profile === "WEEKLY") {
    return "ENABLED";
  }

  if (profile === "PROFESSION" || profile === "MINIMAL") {
    return "DISABLED_BY_PROFILE";
  }

  return "ENABLED";
}

export function isWeeklyGameplayDomainEnabled(
  profile: CharacterTrackingProfile,
  domain: WeeklyGameplayDomain
): boolean {
  return (
    resolveWeeklyGameplayDomainApplicability(profile, domain) ===
    "ENABLED"
  );
}

export function isWeeklyGameplayEnabled(
  profile: CharacterTrackingProfile
): boolean {
  return isWeeklyGameplayDomainEnabled(profile, "vault");
}
