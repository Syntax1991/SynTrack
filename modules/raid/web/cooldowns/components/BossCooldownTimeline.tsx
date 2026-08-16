import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type { RaidSetupMember } from "../../raid-setup/types/raidSetup.types";
import type {
  RaidBossAbilityCast,
  RaidBossPhaseMarker,
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import { planningDurationSeconds } from "../utils/timelineFormat";
import { TimelineGrid } from "./TimelineGrid";

type BossCooldownTimelineProps = {
  bossId: string;
  abilityCasts: RaidBossAbilityCast[];
  phaseMarkers: RaidBossPhaseMarker[];
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  setupMembers: RaidSetupMember[];
  planMemberIds: Set<string>;
  onAddPlanMember: (
    memberId: string
  ) => void;
  onRemovePlanMember: (
    memberId: string
  ) => void;
  setupUrl: string;
  onAddAssignment: (
    bossId: string,
    input: RaidCooldownAssignmentInput
  ) => Promise<void>;
  onRemoveAssignment: (
    assignmentId: string
  ) => void;
  onRepositionAssignment: (
    assignment: RaidCooldownAssignment,
    seconds: number
  ) => void;
  onRemovePhaseMarker: (
    markerId: string
  ) => void;
};

export function BossCooldownTimeline({
  bossId,
  abilityCasts,
  phaseMarkers,
  assignments,
  rosterMembers,
  lineupMemberIds,
  setupMembers,
  planMemberIds,
  onAddPlanMember,
  onRemovePlanMember,
  setupUrl,
  onAddAssignment,
  onRemoveAssignment,
  onRepositionAssignment,
  onRemovePhaseMarker
}: BossCooldownTimelineProps) {
  return (
    <TimelineGrid
      assignments={assignments}
      bossAbilityCasts={abilityCasts}
      lineupMemberIds={
        lineupMemberIds
      }
      onAddPlanMember={
        onAddPlanMember
      }
      onCreateAssignment={(
        input
      ) => {
        void onAddAssignment(
          bossId,
          input
        );
      }}
      onRemoveAssignment={
        onRemoveAssignment
      }
      onRemovePhaseMarker={
        onRemovePhaseMarker
      }
      onRemovePlanMember={
        onRemovePlanMember
      }
      onRepositionAssignment={
        onRepositionAssignment
      }
      planMemberIds={
        planMemberIds
      }
      planningDurationSeconds={
        planningDurationSeconds
      }
      phaseMarkers={phaseMarkers}
      rosterMembers={rosterMembers}
      setupMembers={setupMembers}
      setupUrl={setupUrl}
    />
  );
}
