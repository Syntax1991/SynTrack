export type BattleNetMediaAsset = {
  key?: string;
  value?: string;
};

export type BattleNetMediaResponse = {
  assets?: BattleNetMediaAsset[];
};

export type BattleNetItemQuality = {
  type?: string;
  name?: string;
};

export type BattleNetItemResponse = {
  quality?: BattleNetItemQuality;
  level?: number;
};

export type BattleNetTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
};

export type BattleNetUserInfo = {
  id?: number;
  sub?: string;
  battletag?: string;
};

export type BattleNetAccountCharacter = {
  id?: number;
  name?: string;
  level?: number;
  realm?: {
    id?: number;
    name?: string;
    slug?: string;
  };
  playable_class?: {
    id?: number;
    name?: string;
  };
};

export type BattleNetAccountProfile = {
  wow_accounts?: Array<{
    id?: number;
    characters?: BattleNetAccountCharacter[];
  }>;
};

export type BattleNetProfessionTier = {
  skill_points?: number;
  max_skill_points?: number;
  tier?: {
    id?: number;
    name?: string;
  };
};

export type BattleNetProfessionEntry = {
  profession?: {
    id?: number;
    name?: string;
  };
  tiers?: BattleNetProfessionTier[];
};

export type BattleNetProfessionsResponse = {
  primaries?: BattleNetProfessionEntry[];
  secondaries?: BattleNetProfessionEntry[];
};

export type BattleNetGuildReference = {
  name?: string;
  id?: number;
  realm?: {
    name?: string;
    slug?: string;
  };
  faction?: {
    type?: string;
    name?: string;
  };
  key?: {
    href?: string;
  };
};

export type BattleNetCharacterProfile = {
  name?: string;
  level?: number;
  realm?: {
    name?: string;
    slug?: string;
  };
  guild?: BattleNetGuildReference;
  /*
   * character_class/race/active_spec carry a stable numeric id plus a
   * display name in whichever locale BATTLENET_LOCALE is configured for
   * (this deployment runs de_DE) - never assume .name is English.
   * faction.type ("ALLIANCE" | "HORDE") is the one locale-independent
   * field on faction; faction.name is localized like the others.
   */
  character_class?: {
    id?: number;
    name?: string;
  };
  race?: {
    id?: number;
    name?: string;
  };
  faction?: {
    type?: string;
    name?: string;
  };
  active_spec?: {
    id?: number;
    name?: string;
  };
  average_item_level?: number;
  equipped_item_level?: number;
};

export type BattleNetGuildRosterMember = {
  character?: {
    name?: string;
    id?: number;
    level?: number;
    realm?: {
      name?: string;
      slug?: string;
    };
    playable_class?: {
      name?: string;
    };
  };
  rank?: number;
};

export type BattleNetGuildRoster = {
  guild?: BattleNetGuildReference;
  members?: BattleNetGuildRosterMember[];
};

export type BattleNetEquippedItemSlot = {
  type?: string;
  name?: string;
};

export type BattleNetEquippedItemLevel = {
  value?: number;
};

export type BattleNetEquippedItemSocket = {
  item?: {
    id?: number;
  };
};

export type BattleNetEquippedItemQuality = {
  type?: string;
  name?: string;
};

export type BattleNetEquippedItemUpgrade = {
  value?: number;
  max_value?: number;
};

export type BattleNetEquippedItemEnchantment = {
  enchantment_id?: number;
  display_string?: string;
};

export type BattleNetEquippedItemSetReference = {
  item_set?: {
    id?: number;
    name?: string;
  };
};

export type BattleNetEquippedItem = {
  name?: string;
  slot?: BattleNetEquippedItemSlot;
  level?: BattleNetEquippedItemLevel;
  quality?: BattleNetEquippedItemQuality;
  enchantments?: BattleNetEquippedItemEnchantment[];
  sockets?: BattleNetEquippedItemSocket[];
  upgrades?: BattleNetEquippedItemUpgrade;
  /*
   * Raw evidence preserved for later tier-set/embellishment
   * classification (currently done client-side by the addon's
   * GearEvidence.enrichEquippedSlot) - never itself interpreted as
   * "isTier"/"isEmbellished" here.
   */
  item?: {
    id?: number;
  };
  bonus_list?: number[];
  set?: BattleNetEquippedItemSetReference;
};

export type BattleNetCharacterEquipment = {
  equipped_items?: BattleNetEquippedItem[];
};

export type BattleNetCharacterPreview = {
  key: string;
  battleNetId: string;
  name: string;
  realm: string;
  realmSlug: string;
  className: string;
  level: number;
  imported: boolean;
};

export type BattleNetCharacterPreviewResult = {
  items: BattleNetCharacterPreview[];
  totalCharacters: number;
  defaultMinimumLevel: number;
};

export type BattleNetImportFailure = {
  name: string;
  realm: string;
  error: string;
};

export type BattleNetImportResult = {
  totalCharacters: number;
  importedCharacters: number;
  failedCharacters: BattleNetImportFailure[];
};

/*
 * Shape confirmed against a real live response (2026-09-04, Synblast/
 * Antonidas/EU) rather than assumed from Blizzard's docs alone.
 * `current_period` is keyed to a WEEKLY period id (mythic-keystone/period/
 * {id}) - `best_runs` under it is the best completed run PER DUNGEON for
 * THAT WEEKLY PERIOD, never the season's all-time best and never
 * SynTrack's own Vault run count/list. `seasons[]` links to a per-season
 * sub-resource this phase does not fetch (see Phase D9's documented scope
 * decision) - present here only so a snapshot can record which seasons
 * Blizzard says exist without this phase acting on it.
 */
export type BattleNetMythicKeystoneAffix = {
  id?: number;
  name?: string;
};

export type BattleNetMythicKeystoneRating = {
  rating?: number;
};

export type BattleNetMythicKeystoneDungeon = {
  id?: number;
  name?: string;
};

export type BattleNetMythicKeystoneBestRun = {
  completed_timestamp?: number;
  duration?: number;
  keystone_level?: number;
  keystone_affixes?: BattleNetMythicKeystoneAffix[];
  members?: unknown[];
  dungeon?: BattleNetMythicKeystoneDungeon;
  is_completed_within_time?: boolean;
  mythic_rating?: BattleNetMythicKeystoneRating;
  map_rating?: BattleNetMythicKeystoneRating;
};

export type BattleNetMythicKeystonePeriod = {
  period?: {
    id?: number;
  };
  best_runs?: BattleNetMythicKeystoneBestRun[];
};

export type BattleNetMythicKeystoneSeasonReference = {
  id?: number;
};

export type BattleNetMythicKeystoneProfile = {
  current_period?: BattleNetMythicKeystonePeriod;
  seasons?: BattleNetMythicKeystoneSeasonReference[];
  current_mythic_rating?: BattleNetMythicKeystoneRating;
};