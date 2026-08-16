import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  RaidBoss,
  RaidBossInput,
  RaidBossListResponse,
  RaidBossRosterStatus
} from "../types/bossRoster.types";

export function getBossesForSetup(
  setupId: string
): Promise<RaidBossListResponse> {
  return apiRequest<RaidBossListResponse>(
    `/raid/boss-rosters/setups/${setupId}`
  );
}

export function createBoss(
  eventId: string,
  input: RaidBossInput
): Promise<RaidBoss> {
  return apiRequest<RaidBoss>(
    `/raid/boss-rosters/events/${eventId}/bosses`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function updateBoss(
  bossId: string,
  input: RaidBossInput
): Promise<RaidBoss> {
  return apiRequest<RaidBoss>(
    `/raid/boss-rosters/bosses/${bossId}`,
    {
      method: "PUT",
      body: JSON.stringify(input)
    }
  );
}

export function deleteBoss(
  bossId: string
): Promise<void> {
  return apiRequest<void>(
    `/raid/boss-rosters/bosses/${bossId}`,
    {
      method: "DELETE"
    }
  );
}

export function setBossRosterEntry(
  setupId: string,
  bossId: string,
  memberId: string,
  status: RaidBossRosterStatus
): Promise<RaidBoss> {
  return apiRequest<RaidBoss>(
    `/raid/boss-rosters/setups/${setupId}/bosses/${bossId}/members/${memberId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        status
      })
    }
  );
}

export function clearBossRosterEntry(
  setupId: string,
  bossId: string,
  memberId: string
): Promise<RaidBoss> {
  return apiRequest<RaidBoss>(
    `/raid/boss-rosters/setups/${setupId}/bosses/${bossId}/members/${memberId}`,
    {
      method: "DELETE"
    }
  );
}

export function setBossRosterEntrySpec(
  setupId: string,
  bossId: string,
  memberId: string,
  specId: number | null
): Promise<RaidBoss> {
  return apiRequest<RaidBoss>(
    `/raid/boss-rosters/setups/${setupId}/bosses/${bossId}/members/${memberId}/spec`,
    {
      method: "PUT",
      body: JSON.stringify({
        specId
      })
    }
  );
}
