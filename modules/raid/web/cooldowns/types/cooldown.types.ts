export type RaidCooldownAssignment = {
  id: string;
  bossId: string;
  setupId: string;
  memberId: string;
  abilityName: string;
  spellId: number | null;
  abilityIcon: string | null;
  phaseLabel: string | null;
  timestampSeconds: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RaidCooldownAssignmentInput = {
  memberId: string;
  abilityName: string;
  spellId: number | null;
  abilityIcon: string | null;
  phaseLabel: string | null;
  timestampSeconds: number | null;
  sortOrder: number;
};

export type RaidCooldownAssignmentListResponse = {
  items: RaidCooldownAssignment[];
  total: number;
};

export type RaidBossPhaseMarker = {
  id: string;
  bossId: string;
  label: string;
  startSeconds: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RaidBossPhaseMarkerInput = {
  label: string;
  startSeconds: number;
  sortOrder: number;
};

export type RaidBossPhaseMarkerListResponse = {
  items: RaidBossPhaseMarker[];
  total: number;
};

export type RaidBossAbilityCast = {
  id: string;
  bossId: string;
  abilityName: string;
  abilityIcon: string | null;
  timestampSeconds: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RaidBossAbilityCastListResponse = {
  items: RaidBossAbilityCast[];
  total: number;
};

export type RaidCooldownPlanMember = {
  id: string;
  bossId: string;
  setupId: string;
  memberId: string;
  sortOrder: number;
  createdAt: string;
};

export type RaidCooldownPlanMemberListResponse = {
  items: RaidCooldownPlanMember[];
  total: number;
};

export type RaidBossWarcraftLogsSyncResult = {
  boss: {
    id: string;
    fightDurationSeconds: number | null;
    wclReportCode: string | null;
    wclFightId: number | null;
    wclSyncedAt: string | null;
  };
  casts: RaidBossAbilityCast[];
};
