export type RaidBossRosterStatus =
  | "CONFIRMED"
  | "TENTATIVE"
  | "BENCH";

export type RaidBossRosterMember = {
  id: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
  rank: string;
};

export type RaidBossRosterEntry = {
  id: string;
  bossId: string;
  setupId: string;
  memberId: string;
  status: RaidBossRosterStatus;
  specId: number | null;
  createdAt: string;
  updatedAt: string;
  member: RaidBossRosterMember | null;
};

export type RaidBoss = {
  id: string;
  raidEventId: string;
  name: string;
  sortOrder: number;
  fightDurationSeconds: number | null;
  wclReportCode: string | null;
  wclFightId: number | null;
  wclSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rosterEntries: RaidBossRosterEntry[];
};

export type RaidBossInput = {
  name: string;
  sortOrder: number;
};

export type RaidBossListResponse = {
  items: RaidBoss[];
  total: number;
};
