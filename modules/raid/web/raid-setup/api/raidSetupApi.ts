import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  RaidSetup,
  RaidSetupListResponse
} from "../types/raidSetup.types";

export function getSetupForEvent(
  eventId: string
): Promise<RaidSetup> {
  return apiRequest<RaidSetup>(
    `/raid/setups/events/${eventId}`
  );
}

export function listSetupsForEvent(
  eventId: string
): Promise<RaidSetupListResponse> {
  return apiRequest<RaidSetupListResponse>(
    `/raid/setups/events/${eventId}/setups`
  );
}

export function createSetup(
  eventId: string,
  name: string
): Promise<RaidSetup> {
  return apiRequest<RaidSetup>(
    `/raid/setups/events/${eventId}/setups`,
    {
      method: "POST",
      body: JSON.stringify({ name })
    }
  );
}

export function addSetupMembers(
  setupId: string,
  memberIds: string[]
): Promise<RaidSetup> {
  return apiRequest<RaidSetup>(
    `/raid/setups/${setupId}/members`,
    {
      method: "POST",
      body: JSON.stringify({ memberIds })
    }
  );
}

export function removeSetupMember(
  setupId: string,
  memberId: string
): Promise<RaidSetup> {
  return apiRequest<RaidSetup>(
    `/raid/setups/${setupId}/members/${memberId}`,
    {
      method: "DELETE"
    }
  );
}

export function updateSetupRosterFromTeam(
  setupId: string
): Promise<RaidSetup> {
  return apiRequest<RaidSetup>(
    `/raid/setups/${setupId}/update-roster`,
    {
      method: "POST"
    }
  );
}
