import { useState } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type {
  RaidBossAbilityCast,
  RaidBossPhaseMarker,
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { CooldownDisplayCategory } from "../utils/cooldownCategories";
import { planningDurationSeconds } from "../utils/timelineFormat";
import { TimelineGrid } from "./TimelineGrid";

type BossCooldownTimelineProps = {
  bossId: string;
  abilityCasts: RaidBossAbilityCast[];
  phaseMarkers: RaidBossPhaseMarker[];
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
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
  onAddAssignment,
  onRemoveAssignment,
  onRepositionAssignment,
  onRemovePhaseMarker
}: BossCooldownTimelineProps) {
  const [
    pendingCreation,
    setPendingCreation
  ] = useState<{
    memberId: string;
    category: CooldownDisplayCategory;
    seconds: number;
  } | null>(null);

  return (
    <TimelineGrid
      assignments={assignments}
      bossAbilityCasts={abilityCasts}
      lineupMemberIds={
        lineupMemberIds
      }
      onCancelCreate={() =>
        setPendingCreation(null)
      }
      onCreateAssignment={(
        input
      ) => {
        setPendingCreation(null);

        void onAddAssignment(
          bossId,
          input
        );
      }}
      onRaiderTrackClick={(
        memberId,
        category,
        seconds
      ) =>
        setPendingCreation({
          memberId,
          category,
          seconds
        })
      }
      onRemoveAssignment={
        onRemoveAssignment
      }
      onRemovePhaseMarker={
        onRemovePhaseMarker
      }
      onRepositionAssignment={
        onRepositionAssignment
      }
      pendingCreation={
        pendingCreation
      }
      planningDurationSeconds={
        planningDurationSeconds
      }
      phaseMarkers={phaseMarkers}
      rosterMembers={rosterMembers}
    />
  );
}
