import type { BattleNetCharacterProfile } from "../../../data-platform/api/integrations/battlenet/battlenet.types.js";
import { resolveCanonicalClassName } from "./wow-class-catalog.js";
import type { NormalizedBlizzardProfilePayload } from "./character-external-sync.types.js";

export type ProfileNormalizationContext = {
  requestedName: string;
  requestedRealm: string;
};

function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function normalizeBlizzardProfile(
  profile: BattleNetCharacterProfile,
  context: ProfileNormalizationContext
): NormalizedBlizzardProfilePayload {
  const reportedName = profile.name ?? null;
  const reportedRealmName = profile.realm?.name ?? null;
  const reportedRealmSlug = profile.realm?.slug ?? null;

  const identityMismatch =
    (reportedName !== null &&
      !namesMatch(reportedName, context.requestedName)) ||
    (reportedRealmName !== null &&
      !namesMatch(reportedRealmName, context.requestedRealm));

  return {
    reportedName,
    reportedRealmName,
    reportedRealmSlug,
    identityMismatch,
    level: typeof profile.level === "number" ? profile.level : null,
    classId: profile.character_class?.id ?? null,
    className: resolveCanonicalClassName(profile.character_class?.id),
    raceId: profile.race?.id ?? null,
    raceName: profile.race?.name ?? null,
    faction: profile.faction?.type ?? null,
    activeSpecId: profile.active_spec?.id ?? null,
    activeSpecName: profile.active_spec?.name ?? null,
    guildName: profile.guild?.name ?? null,
    guildRealmSlug: profile.guild?.realm?.slug ?? null,
    averageItemLevel:
      typeof profile.average_item_level === "number"
        ? profile.average_item_level
        : null,
    equippedItemLevel:
      typeof profile.equipped_item_level === "number"
        ? profile.equipped_item_level
        : null
  };
}
