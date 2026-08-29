export type GearSlotKey =
  | "HEAD"
  | "NECK"
  | "SHOULDER"
  | "BACK"
  | "CHEST"
  | "WRIST"
  | "HANDS"
  | "WAIST"
  | "LEGS"
  | "FEET"
  | "FINGER_1"
  | "FINGER_2"
  | "TRINKET_1"
  | "TRINKET_2"
  | "MAIN_HAND"
  | "OFF_HAND";

export type EnchantStatus =
  | "NOT_APPLICABLE"
  | "MISSING"
  | "READY";

export type GearSlotItem = {
  id: string;
  itemName: string | null;
  itemLevel: number | null;
  enchantStatus: EnchantStatus;
  enchantName: string | null;
  socketCount: number | null;
  gemCount: number;
  notes: string | null;
  source: string;
  lastSyncedAt: string | null;
  updatedAt: string;
  setId: number | null;
  expansionId: number | null;
  setEvidenceResolved: boolean | null;
  setBonusResolved: boolean | null;
  setBonusSpellIds: number[] | null;
  uniqueCategoryId: number | null;
  uniqueCategoryCount: number | null;
  uniquenessResolved: boolean | null;
};

export type GearSlot = {
  key: GearSlotKey;
  label: string;
  category: "ARMOR" | "ACCESSORIES" | "WEAPONS";
  sortOrder: number;
  supportsEnchant: boolean;
  item: GearSlotItem | null;
  issues: {
    missingEnchant: boolean;
    missingGemCount: number;
    issueCount: number;
  };
};

export type GearCharacter = {
  id: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
  slots: GearSlot[];
  trackedSlotCount: number;
  averageItemLevel: number | null;
  issueCount: number;
  readinessPercent: number;
  currentExpansionId: number | null;
};

export type GearReadinessOverview = {
  characters: GearCharacter[];
  summary: {
    trackedItemCount: number;
    averageItemLevel: number | null;
    missingEnchantCount: number;
    emptySocketCount: number;
    readyCharacterCount: number;
  };
};

export type GearSlotInput = {
  itemName: string;
  itemLevel?: number;
  enchantStatus: EnchantStatus;
  enchantName?: string;
  socketCount: number;
  gemCount: number;
  notes?: string;
};

export type GearSlotFilter =
  | "all"
  | "issues"
  | "tracked";
