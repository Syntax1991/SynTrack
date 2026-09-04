/*
 * Generic external-source snapshot vocabulary, shared across every
 * future domain (EQUIPMENT first, then PROFILE/PROFESSIONS/
 * MYTHIC_PLUS/ACHIEVEMENTS) - plain string unions rather than Prisma
 * enums, matching this schema's existing convention (Character.source,
 * CharacterGearSlot.source, etc.) so a new source/domain never needs a
 * migration.
 */
export const EXTERNAL_SOURCE_BLIZZARD = "BLIZZARD";

export type ExternalSnapshotSource = typeof EXTERNAL_SOURCE_BLIZZARD;

export const EXTERNAL_DOMAIN_EQUIPMENT = "EQUIPMENT";
export const EXTERNAL_DOMAIN_PROFILE = "PROFILE";

export type ExternalSnapshotDomain =
  | typeof EXTERNAL_DOMAIN_EQUIPMENT
  | typeof EXTERNAL_DOMAIN_PROFILE;

export type ExternalSnapshotStatus = "SUCCESS" | "FAILED";

export type ExternalSnapshotRecord<TPayload> = {
  characterId: string;
  source: ExternalSnapshotSource;
  domain: ExternalSnapshotDomain;
  payload: TPayload | null;
  fetchedAt: Date | null;
  lastAttemptAt: Date;
  lastStatus: ExternalSnapshotStatus;
  lastError: string | null;
};

export type NormalizedBlizzardEquipmentSlot = {
  slotKey: string;
  itemId: number | null;
  itemName: string | null;
  itemLevel: number | null;
  quality: string | null;
  hasEnchant: boolean;
  enchantIds: number[];
  socketCount: number;
  filledSocketCount: number;
  bonusList: number[];
  setId: number | null;
  setName: string | null;
  upgradeCurrent: number | null;
  upgradeMax: number | null;
};

export type NormalizedBlizzardEquipmentPayload = {
  averageItemLevel: number | null;
  slots: NormalizedBlizzardEquipmentSlot[];
};

export type AuthoritativeEquipmentSlot = {
  slotKey: string;
  itemName: string | null;
  itemLevel: number | null;
};

export type AuthoritativeEquipmentResult = {
  source: "BLIZZARD" | "ADDON" | "NONE";
  averageItemLevel: number | null;
  slots: AuthoritativeEquipmentSlot[];
  fetchedAt: Date | null;
  isStale: boolean;
};

export type EquipmentRefreshOutcome =
  | {
      status: "SUCCESS";
      characterId: string;
      slotCount: number;
      averageItemLevel: number | null;
    }
  | {
      status: "FAILED";
      characterId: string;
      reason: string;
    }
  | {
      status: "NOT_FOUND";
      characterId: string;
    };

export type EquipmentRefreshSummary = {
  totalCharacters: number;
  succeeded: number;
  failed: number;
  results: EquipmentRefreshOutcome[];
};

export type NormalizedBlizzardProfilePayload = {
  /*
   * The requested character's identity, as Blizzard reported it back -
   * kept purely informational (see identityMismatch below). Never
   * written back onto Character.name/realm - those stay SynTrack's own
   * tracking identity (category A), untouched by any external source.
   */
  reportedName: string | null;
  reportedRealmName: string | null;
  reportedRealmSlug: string | null;
  /*
   * True only if Blizzard's returned name/realm differ from the
   * requested character by more than casing - should be effectively
   * impossible in normal operation (Blizzard 404s a renamed/transferred
   * character's old realm+name rather than redirecting), but recorded
   * rather than assumed. Never triggers any automatic rename, merge, or
   * deletion - purely a flag for a human/future tooling to look at.
   */
  identityMismatch: boolean;
  level: number | null;
  classId: number | null;
  /** Canonical English name via wow-class-catalog - safe for classColors. */
  className: string | null;
  raceId: number | null;
  /** Blizzard's localized display name (BATTLENET_LOCALE) - not canonicalized. */
  raceName: string | null;
  /** From faction.type - stable, not localized ("ALLIANCE" | "HORDE"). */
  faction: string | null;
  activeSpecId: number | null;
  /** Blizzard's localized display name (BATTLENET_LOCALE) - not canonicalized. */
  activeSpecName: string | null;
  guildName: string | null;
  guildRealmSlug: string | null;
  averageItemLevel: number | null;
  equippedItemLevel: number | null;
};

export type AuthoritativeProfileResult = {
  source: "BLIZZARD" | "NONE";
  fetchedAt: Date | null;
  isStale: boolean;
  /** Always from the Character row - never overwritten by an external source. */
  name: string;
  realm: string;
  region: string;
  /** Blizzard-authoritative when a snapshot exists, else the Character row's value. */
  level: number;
  /** Blizzard-authoritative when a snapshot exists, else the Character row's value. */
  class: string;
  race: string | null;
  faction: string | null;
  activeSpec: string | null;
  guild: { name: string; realmSlug: string | null } | null;
  averageItemLevel: number | null;
  equippedItemLevel: number | null;
};

export type ProfileRefreshOutcome =
  | {
      status: "SUCCESS";
      characterId: string;
      identityMismatch: boolean;
    }
  | {
      status: "FAILED";
      characterId: string;
      reason: string;
    }
  | {
      status: "NOT_FOUND";
      characterId: string;
    };

export type ProfileRefreshSummary = {
  totalCharacters: number;
  succeeded: number;
  failed: number;
  results: ProfileRefreshOutcome[];
};
