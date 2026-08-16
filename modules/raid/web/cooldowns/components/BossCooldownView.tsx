import { useState } from "react";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { useBossAbilityCasts } from "../hooks/useBossAbilityCasts";
import { usePhaseMarkers } from "../hooks/usePhaseMarkers";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import { BossCooldownTimeline } from "./BossCooldownTimeline";
import { BossWorkspaceHeader } from "./BossWorkspaceHeader";
import { CooldownBossPanel } from "./CooldownBossPanel";
import { PhaseMarkerForm } from "./PhaseMarkerForm";

type BossCooldownViewProps = {
  bossId: string;
  bossName: string;
  /**
   * The real duration of the currently synced Warcraft Logs pull —
   * useful source metadata, kept around and never overwritten, but
   * not read here. The Cooldown Planner always renders against the
   * fixed `planningDurationSeconds` (see `BossCooldownTimeline`).
   */
  fightDurationSeconds: number | null;
  wclSyncedAt: string | null;
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  abilitySuggestions: string[];
  onSyncWarcraftLogs: () => Promise<void>;
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
};

export function BossCooldownView({
  bossId,
  bossName,
  wclSyncedAt,
  assignments,
  rosterMembers,
  lineupMemberIds,
  abilitySuggestions,
  onSyncWarcraftLogs,
  onAddAssignment,
  onRemoveAssignment,
  onRepositionAssignment
}: BossCooldownViewProps) {
  const [view, setView] = useState<
    "timeline" | "list"
  >("timeline");

  const phaseMarkers =
    usePhaseMarkers(bossId);

  const abilityCasts =
    useBossAbilityCasts(bossId);

  const [isSyncing, setIsSyncing] =
    useState(false);

  const [syncError, setSyncError] =
    useState<string | null>(null);

  const [isPhaseFormOpen, setIsPhaseFormOpen] =
    useState(false);

  const handleSync = async () => {
    setSyncError(null);
    setIsSyncing(true);

    try {
      await onSyncWarcraftLogs();
      await abilityCasts.reload();
    }
    catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Sync fehlgeschlagen."
      );
    }
    finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <BossWorkspaceHeader
        bossName={bossName}
        isPhaseFormOpen={
          isPhaseFormOpen
        }
        isSyncing={isSyncing}
        onSync={() =>
          void handleSync()
        }
        onTogglePhaseForm={() =>
          setIsPhaseFormOpen(
            (current) => !current
          )
        }
        onViewChange={setView}
        view={view}
        wclSyncedAt={wclSyncedAt}
      />

      {syncError && (
        <StatusMessage type="error">
          {syncError}
        </StatusMessage>
      )}

      {isPhaseFormOpen && (
        <PhaseMarkerForm
          onSubmit={async (
            input
          ) => {
            await phaseMarkers.addMarker(
              input
            );

            setIsPhaseFormOpen(
              false
            );
          }}
        />
      )}

      {view === "timeline" ? (
        <BossCooldownTimeline
          abilityCasts={
            abilityCasts.casts
          }
          assignments={assignments}
          bossId={bossId}
          lineupMemberIds={
            lineupMemberIds
          }
          onAddAssignment={
            onAddAssignment
          }
          onRemoveAssignment={
            onRemoveAssignment
          }
          onRemovePhaseMarker={(
            markerId
          ) => {
            void phaseMarkers.removeMarker(
              markerId
            );
          }}
          onRepositionAssignment={
            onRepositionAssignment
          }
          phaseMarkers={
            phaseMarkers.markers
          }
          rosterMembers={
            rosterMembers
          }
        />
      ) : (
        <CooldownBossPanel
          abilitySuggestions={
            abilitySuggestions
          }
          assignments={assignments}
          bossId={bossId}
          bossName={bossName}
          onAdd={onAddAssignment}
          onRemove={
            onRemoveAssignment
          }
          rosterMembers={
            rosterMembers
          }
        />
      )}
    </div>
  );
}
