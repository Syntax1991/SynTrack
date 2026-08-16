import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  RaidBossAbilityCastListResponse,
  RaidBossPhaseMarker,
  RaidBossPhaseMarkerInput,
  RaidBossPhaseMarkerListResponse,
  RaidBossWarcraftLogsSyncResult,
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput,
  RaidCooldownAssignmentListResponse,
  RaidCooldownPlanMember,
  RaidCooldownPlanMemberListResponse
} from "../types/cooldown.types";

// Planning data (assignments, plan members) is Setup+Boss scoped — a
// Setup belongs to exactly one RaidEvent, so scoping by setupId alone
// already covers every boss of that event.
export function getCooldownAssignmentsForSetup(
  setupId: string
): Promise<RaidCooldownAssignmentListResponse> {
  return apiRequest<RaidCooldownAssignmentListResponse>(
    `/raid/cooldowns/setups/${setupId}`
  );
}

export function createCooldownAssignment(
  setupId: string,
  bossId: string,
  input: RaidCooldownAssignmentInput
): Promise<RaidCooldownAssignment> {
  return apiRequest<RaidCooldownAssignment>(
    `/raid/cooldowns/setups/${setupId}/bosses/${bossId}`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function updateCooldownAssignment(
  setupId: string,
  bossId: string,
  assignmentId: string,
  input: RaidCooldownAssignmentInput
): Promise<RaidCooldownAssignment> {
  return apiRequest<RaidCooldownAssignment>(
    `/raid/cooldowns/setups/${setupId}/bosses/${bossId}/${assignmentId}`,
    {
      method: "PUT",
      body: JSON.stringify(input)
    }
  );
}

export function deleteCooldownAssignment(
  setupId: string,
  bossId: string,
  assignmentId: string
): Promise<void> {
  return apiRequest<void>(
    `/raid/cooldowns/setups/${setupId}/bosses/${bossId}/${assignmentId}`,
    {
      method: "DELETE"
    }
  );
}

export function getPlanMembersForSetupAndBoss(
  setupId: string,
  bossId: string
): Promise<RaidCooldownPlanMemberListResponse> {
  return apiRequest<RaidCooldownPlanMemberListResponse>(
    `/raid/cooldowns/setups/${setupId}/bosses/${bossId}/plan-members`
  );
}

export function addPlanMember(
  setupId: string,
  bossId: string,
  memberId: string
): Promise<RaidCooldownPlanMember> {
  return apiRequest<RaidCooldownPlanMember>(
    `/raid/cooldowns/setups/${setupId}/bosses/${bossId}/plan-members`,
    {
      method: "POST",
      body: JSON.stringify({ memberId })
    }
  );
}

export function removePlanMember(
  setupId: string,
  bossId: string,
  memberId: string
): Promise<void> {
  return apiRequest<void>(
    `/raid/cooldowns/setups/${setupId}/bosses/${bossId}/plan-members/${memberId}`,
    {
      method: "DELETE"
    }
  );
}

// Encounter facts (WCL casts, phases, fight duration) describe the
// fight itself, not any particular composition — these stay boss-only
// regardless of Setup.
export function updateBossFightDuration(
  bossId: string,
  fightDurationSeconds: number | null
): Promise<unknown> {
  return apiRequest(
    `/raid/cooldowns/bosses/${bossId}/duration`,
    {
      method: "PUT",
      body: JSON.stringify({
        fightDurationSeconds
      })
    }
  );
}

export function getPhaseMarkersForBoss(
  bossId: string
): Promise<RaidBossPhaseMarkerListResponse> {
  return apiRequest<RaidBossPhaseMarkerListResponse>(
    `/raid/cooldowns/bosses/${bossId}/phase-markers`
  );
}

export function createPhaseMarker(
  bossId: string,
  input: RaidBossPhaseMarkerInput
): Promise<RaidBossPhaseMarker> {
  return apiRequest<RaidBossPhaseMarker>(
    `/raid/cooldowns/bosses/${bossId}/phase-markers`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function deletePhaseMarker(
  markerId: string
): Promise<void> {
  return apiRequest<void>(
    `/raid/cooldowns/phase-markers/${markerId}`,
    {
      method: "DELETE"
    }
  );
}

export function getAbilityCastsForBoss(
  bossId: string
): Promise<RaidBossAbilityCastListResponse> {
  return apiRequest<RaidBossAbilityCastListResponse>(
    `/raid/cooldowns/bosses/${bossId}/ability-casts`
  );
}

export function syncBossWarcraftLogs(
  bossId: string
): Promise<RaidBossWarcraftLogsSyncResult> {
  return apiRequest<RaidBossWarcraftLogsSyncResult>(
    `/raid/cooldowns/bosses/${bossId}/sync-wcl`,
    {
      method: "POST"
    }
  );
}
