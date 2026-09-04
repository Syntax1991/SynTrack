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

export type ExternalSnapshotDomain = typeof EXTERNAL_DOMAIN_EQUIPMENT;

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
