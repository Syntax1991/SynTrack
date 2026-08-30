import type { TagView } from "../tags/tag.types.js";

/*
 * Minimal tracking profiles — enough for weekly gameplay applicability.
 * Full per-domain overrides belong in a later phase.
 */
export type CharacterTrackingProfile =
  | "FULL"
  | "WEEKLY"
  | "PROFESSION"
  | "MINIMAL";

const PROFILE_TAG_NAMES: Record<
  CharacterTrackingProfile,
  readonly string[]
> = {
  PROFESSION: ["profession"],
  MINIMAL: ["minimal", "parked"],
  WEEKLY: ["weekly", "weekly alt", "alt"],
  FULL: ["main"]
};

const PROFILE_PRIORITY: CharacterTrackingProfile[] = [
  "PROFESSION",
  "MINIMAL",
  "WEEKLY",
  "FULL"
];

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

/*
 * Single seam where roster tag labels may seed profile identity until an
 * explicit profile field exists. Tags remain grouping metadata elsewhere.
 */
export function resolveCharacterTrackingProfile(
  tags: Pick<TagView, "name">[]
): CharacterTrackingProfile {
  const normalized = new Set(
    tags.map((tag) => normalizeTagName(tag.name))
  );

  for (const profile of PROFILE_PRIORITY) {
    const matches = PROFILE_TAG_NAMES[profile];

    if (matches.some((name) => normalized.has(name))) {
      return profile;
    }
  }

  return "FULL";
}

export {
  isWeeklyGameplayEnabled,
  isWeeklyGameplayDomainEnabled,
  resolveWeeklyGameplayDomainApplicability,
  type DomainApplicability,
  type WeeklyGameplayDomain
} from "./domain-applicability.js";
