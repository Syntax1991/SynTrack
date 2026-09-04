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
export const EXTERNAL_DOMAIN_PROFESSIONS = "PROFESSIONS";
export const EXTERNAL_DOMAIN_MYTHIC_PLUS = "MYTHIC_PLUS";

export type ExternalSnapshotDomain =
  | typeof EXTERNAL_DOMAIN_EQUIPMENT
  | typeof EXTERNAL_DOMAIN_PROFILE
  | typeof EXTERNAL_DOMAIN_PROFESSIONS
  | typeof EXTERNAL_DOMAIN_MYTHIC_PLUS;

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

/*
 * PUBLIC profession facts only - see wow-class-catalog-style locale
 * safety notes in blizzard-professions.normalizer.ts. Knowledge Points,
 * specialization node ranks, weekly quest/Treatise/Treasure state, and
 * crafting simulation are permanently ADDON-only and never appear here.
 */
export type NormalizedBlizzardProfessionEntry = {
  professionId: number;
  /** SynTrack's internal Profession.key via the existing Blizzard-id map; null if Blizzard reports a profession not in SynTrack's catalog. */
  professionKey: string | null;
  /** Blizzard's localized display name - presentation only, never a join key. */
  professionName: string | null;
  /** The resolved CURRENT tier's id (highest numeric tier id) - never the first/last array entry. */
  tierId: number | null;
  /** Blizzard's localized tier display name - presentation only, never a join key. */
  tierName: string | null;
  skill: number | null;
  maxSkill: number | null;
};

export type NormalizedBlizzardProfessionsPayload = {
  professions: NormalizedBlizzardProfessionEntry[];
};

export type AuthoritativeProfessionEntry = {
  source: "BLIZZARD" | "ADDON";
  professionKey: string | null;
  professionId: number | null;
  professionName: string;
  tierId: number | null;
  tierName: string | null;
  skill: number;
  maxSkill: number | null;
  fetchedAt: Date | null;
  isStale: boolean;
};

export type ProfessionsRefreshOutcome =
  | {
      status: "SUCCESS";
      characterId: string;
      professionCount: number;
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

export type ProfessionsRefreshSummary = {
  totalCharacters: number;
  succeeded: number;
  failed: number;
  results: ProfessionsRefreshOutcome[];
};

/*
 * PUBLIC/SEASONAL Mythic+ facts only - see Phase D2's hard authority
 * boundary. This domain never carries current-week Vault run
 * counts/progress, Vault slot thresholds, or anything Great Vault reads -
 * those remain permanently ADDON-only in CharacterWeeklyGameplaySnapshot/
 * CharacterWeeklyVaultActivity/CharacterWeeklyMythicPlusCapture, a
 * completely separate model family this module never imports.
 * `dungeonId` is the same stable Blizzard Challenge Mode Map id space the
 * addon already reports as `mapChallengeModeId` - no separate SynTrack
 * dungeon catalog exists today (verified during the Phase D audit), so
 * none is invented here; `dungeonName` is Blizzard's raw (possibly
 * localized) display text, presentation only, never a join key.
 * `periodId`/`seasonIds` are Blizzard's own weekly-period/season
 * identifiers, kept as raw evidence - never to be confused with
 * SynTrack's own weekly periodKey used by the addon's gameplay snapshots.
 */
export type NormalizedBlizzardMythicPlusBestRun = {
  dungeonId: number | null;
  dungeonName: string | null;
  keystoneLevel: number | null;
  durationMs: number | null;
  /** Raw epoch milliseconds, as Blizzard reported it - evidence, not yet interpreted. */
  completedTimestamp: number | null;
  /**
   * Blizzard's own `is_completed_within_time` - passed through as-is.
   * Never derived/fabricated when Blizzard omits it (stays null).
   */
  completedInTime: boolean | null;
  affixIds: number[];
  runRating: number | null;
  mapRating: number | null;
};

export type NormalizedBlizzardMythicPlusPayload = {
  /**
   * False only when Blizzard confirmed (a clean 404) that this character
   * has no Mythic Keystone profile at all - distinct from a thrown
   * network/5xx error, which never reaches the normalizer and is recorded
   * as a FAILED attempt instead (see CharacterMythicPlusRefreshService).
   */
  hasProfile: boolean;
  /** Math.floor(current_mythic_rating.rating) - see rounding-rule note in the normalizer. */
  rating: number | null;
  /** The unrounded Blizzard value, kept as evidence. */
  rawRating: number | null;
  periodId: number | null;
  seasonIds: number[];
  bestRuns: NormalizedBlizzardMythicPlusBestRun[];
};

export type AuthoritativeMythicPlusBestRun = NormalizedBlizzardMythicPlusBestRun;

export type AuthoritativeMythicPlusResult = {
  source: "BLIZZARD" | "ADDON" | "NONE";
  rating: number | null;
  /** True only when source="BLIZZARD" and Blizzard confirmed a real profile exists. */
  hasProfile: boolean;
  /** Always empty unless source="BLIZZARD" - Blizzard is the only source of per-run evidence in this domain. */
  bestRuns: AuthoritativeMythicPlusBestRun[];
  periodId: number | null;
  fetchedAt: Date | null;
  isStale: boolean;
};

export type MythicPlusRefreshOutcome =
  | {
      status: "SUCCESS";
      characterId: string;
      hasMythicPlusProfile: boolean;
      bestRunCount: number;
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

export type MythicPlusRefreshSummary = {
  totalCharacters: number;
  succeeded: number;
  failed: number;
  results: MythicPlusRefreshOutcome[];
};
