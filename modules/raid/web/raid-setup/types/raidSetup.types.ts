import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";

export type RaidSetupMember = {
  id: string;
  setupId: string;
  memberId: string;
  createdAt: string;
  member: GuildMember | null;
};

export type RaidSetup = {
  id: string;
  raidPlanId: string;
  raidEventId: string | null;
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: RaidSetupMember[];
};

export type RaidSetupListResponse = {
  items: RaidSetup[];
  total: number;
};
