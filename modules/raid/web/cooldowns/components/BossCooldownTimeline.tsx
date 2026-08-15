import { useState } from "react";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { useBossAbilityCasts } from "../hooks/useBossAbilityCasts";
import { usePhaseMarkers } from "../hooks/usePhaseMarkers";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import { formatRelativeTime } from "../utils/timelineFormat";
import { PhaseMarkerForm } from "./PhaseMarkerForm";
import { TimelineGrid } from "./TimelineGrid";

type BossCooldownTimelineProps = {
  bossId: string;
  bossName: string;
  fightDurationSeconds: number | null;
  wclSyncedAt: string | null;
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
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

export function BossCooldownTimeline({
  bossId,
  bossName,
  fightDurationSeconds,
  wclSyncedAt,
  assignments,
  rosterMembers,
  lineupMemberIds,
  onSyncWarcraftLogs,
  onAddAssignment,
  onRemoveAssignment,
  onRepositionAssignment
}: BossCooldownTimelineProps) {
  const phaseMarkers =
    usePhaseMarkers(bossId);

  const abilityCasts =
    useBossAbilityCasts(bossId);

  const [
    pendingCreation,
    setPendingCreation
  ] = useState<{
    memberId: string;
    seconds: number;
  } | null>(null);

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
    <section className="cooldown-timeline-panel">
      <div className="cooldown-timeline-toolbar">
        <h2>{bossName}</h2>

        <button
          className={
            isSyncing
              ? "cooldown-sync-pill is-syncing"
              : "cooldown-sync-pill"
          }
          disabled={isSyncing}
          onClick={() =>
            void handleSync()
          }
          title={
            wclSyncedAt
              ? `Synced from Warcraft Logs — ${new Date(wclSyncedAt).toLocaleString()}. Click to re-sync.`
              : "Not synced from Warcraft Logs yet. Click to sync."
          }
          type="button"
        >
          {isSyncing
            ? "⟳ Syncing…"
            : wclSyncedAt
              ? `⟳ ${formatRelativeTime(wclSyncedAt)}`
              : "⟳ Not synced"}
        </button>

        <button
          aria-label="How this timeline works"
          className="cooldown-help-button"
          title="Boss ability rows are synced from Warcraft Logs — click the sync pill to refresh. Click a raider's row to assign their cooldown; drag a placed cooldown to move it."
          type="button"
        >
          ⓘ
        </button>
      </div>

      {syncError && (
        <StatusMessage type="error">
          {syncError}
        </StatusMessage>
      )}

      {fightDurationSeconds ===
      null ? (
        <p className="muted-text">
          No synced fight duration
          yet. Click the sync pill
          above to pull the boss
          timing from Warcraft Logs.
        </p>
      ) : (
        <>
          <div className="cooldown-timeline-actions">
            <button
              className="text-button"
              onClick={() =>
                setIsPhaseFormOpen(
                  (current) =>
                    !current
                )
              }
              type="button"
            >
              {isPhaseFormOpen
                ? "Cancel"
                : "+ Phase"}
            </button>
          </div>

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

          <TimelineGrid
            assignments={
              assignments
            }
            bossAbilityCasts={
              abilityCasts.casts
            }
            fightDurationSeconds={
              fightDurationSeconds
            }
            lineupMemberIds={
              lineupMemberIds
            }
            onCancelCreate={() =>
              setPendingCreation(
                null
              )
            }
            onCreateAssignment={(
              input
            ) => {
              setPendingCreation(
                null
              );

              void onAddAssignment(
                bossId,
                input
              );
            }}
            onRaiderTrackClick={(
              memberId,
              seconds
            ) =>
              setPendingCreation({
                memberId,
                seconds
              })
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
            pendingCreation={
              pendingCreation
            }
            phaseMarkers={
              phaseMarkers.markers
            }
            rosterMembers={
              rosterMembers
            }
          />
        </>
      )}
    </section>
  );
}
