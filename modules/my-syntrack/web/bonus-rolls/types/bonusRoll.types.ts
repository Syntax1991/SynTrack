export type BonusRollStatus = "PLANNED" | "ROLLED";

/* ITEM: the roll dropped loot. NO_ITEM: gold / consolation only. */
export type BonusRollOutcome = "ITEM" | "NO_ITEM";

export type BonusRollItemRef = {
  id: number;
  name: string;
  iconUrl: string | null;
};

export type BonusRoll = {
  id: string;
  character: {
    id: string;
    name: string;
    realm: string;
    className: string;
  };
  instance: { id: number; name: string };
  encounter: { id: number; name: string };
  targetItem: BonusRollItemRef | null;
  status: BonusRollStatus;
  outcome: BonusRollOutcome | null;
  receivedItem: BonusRollItemRef | null;
  gotTarget: boolean;
  note: string | null;
  rolledAt: string | null;
  createdAt: string;
};

export type JournalInstance = {
  id: number;
  name: string;
  kind: "DUNGEON" | "RAID";
};

export type JournalEncounter = {
  id: number;
  name: string;
};

export type JournalLootItem = {
  id: number;
  name: string;
  slot: string | null;
  quality: string | null;
  iconUrl: string | null;
};

export type BonusRollCreateInput = {
  characterId: string;
  instanceId: number;
  encounterId: number;
  targetItemId: number | null;
  note: string | null;
};

export type BonusRollResultInput = {
  outcome: BonusRollOutcome;
  receivedItemId: number | null;
};
