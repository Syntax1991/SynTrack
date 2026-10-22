export const BONUS_ROLL_STATUSES = ["PLANNED", "ROLLED"] as const;
export type BonusRollStatus = (typeof BONUS_ROLL_STATUSES)[number];

/* ITEM: the roll dropped loot. NO_ITEM: gold / consolation only. */
export const BONUS_ROLL_OUTCOMES = ["ITEM", "NO_ITEM"] as const;
export type BonusRollOutcome = (typeof BONUS_ROLL_OUTCOMES)[number];

export type BonusRollRow = {
  id: string;
  characterId: string;
  instanceId: number;
  instanceName: string;
  encounterId: number;
  encounterName: string;
  targetItemId: number | null;
  targetItemName: string | null;
  targetItemIcon: string | null;
  status: string;
  outcome: string | null;
  receivedItemId: number | null;
  receivedItemName: string | null;
  receivedItemIcon: string | null;
  note: string | null;
  rolledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BonusRollCharacterRef = {
  id: string;
  name: string;
  realm: string;
  className: string;
};

export type BonusRollRowWithCharacter = BonusRollRow & {
  character: BonusRollCharacterRef;
};

export type BonusRollCreateData = {
  characterId: string;
  instanceId: number;
  instanceName: string;
  encounterId: number;
  encounterName: string;
  targetItemId: number | null;
  targetItemName: string | null;
  targetItemIcon: string | null;
  note: string | null;
};

export type BonusRollUpdateData = Partial<{
  targetItemId: number | null;
  targetItemName: string | null;
  targetItemIcon: string | null;
  note: string | null;
  status: BonusRollStatus;
  outcome: BonusRollOutcome | null;
  receivedItemId: number | null;
  receivedItemName: string | null;
  receivedItemIcon: string | null;
  rolledAt: Date | null;
}>;

/*
 * Plain-data contract the service depends on, so tests inject the
 * in-memory fake (bonus-roll.fakes.ts) like the tag/tracker modules.
 */
export interface BonusRollRepositoryContract {
  findAll(): Promise<BonusRollRowWithCharacter[]>;
  findById(id: string): Promise<BonusRollRowWithCharacter | null>;
  create(data: BonusRollCreateData): Promise<BonusRollRowWithCharacter>;
  update(id: string, data: BonusRollUpdateData): Promise<BonusRollRowWithCharacter>;
  delete(id: string): Promise<void>;
  findCharacterExists(characterId: string): Promise<boolean>;
}

export type BonusRollItemRef = {
  id: number;
  name: string;
  iconUrl: string | null;
};

export type BonusRollView = {
  id: string;
  character: BonusRollCharacterRef;
  instance: { id: number; name: string };
  encounter: { id: number; name: string };
  targetItem: BonusRollItemRef | null;
  status: BonusRollStatus;
  outcome: BonusRollOutcome | null;
  receivedItem: BonusRollItemRef | null;
  /* True when the received item is the planned target. */
  gotTarget: boolean;
  note: string | null;
  rolledAt: string | null;
  createdAt: string;
};
