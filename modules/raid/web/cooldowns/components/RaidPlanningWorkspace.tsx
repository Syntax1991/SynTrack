import { useState } from "react";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type { RaidBoss } from "../../boss-rosters/types/bossRoster.types";
import type {
  RaidSetup,
  RaidSetupMember
} from "../../raid-setup/types/raidSetup.types";
import { useBossAbilityCasts } from "../hooks/useBossAbilityCasts";
import { usePhaseMarkers } from "../hooks/usePhaseMarkers";
import { usePlanMembers } from "../hooks/usePlanMembers";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import { BossCooldownTimeline } from "./BossCooldownTimeline";
import { CooldownBossPanel } from "./CooldownBossPanel";
import { PhaseMarkerForm } from "./PhaseMarkerForm";
import { PlanningWorkspaceHeader } from "./PlanningWorkspaceHeader";

type RaidPlanningWorkspaceProps = {
  setupId: string;
  setups: RaidSetup[];
  selectedSetupId: string | null;
  onSelectSetup: (setupId: string) => void;
  bossId: string;
  bossName: string;
  bosses: RaidBoss[];
  onSelectBoss: (bossId: string) => void;
  onBackToEvents: () => void;
  wclSyncedAt: string | null;
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  specIdByMemberId: Map<string, number | null>;
  setupMembers: RaidSetupMember[];
  setupUrl: string;
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

/**
 * The full per-boss planning surface: one dense header (identity,
 * boss switcher, view mode, sync/horizon/overflow) plus the planning
 * body, so this whole route reads as a dedicated planning workspace
 * rather than a content page with a timeline bolted onto the bottom.
 * Boss/event navigation and view-mode state live here now — they
 * used to be spread across the parent page and three components.
 */
export function RaidPlanningWorkspace({
  setupId,
  setups,
  selectedSetupId,
  onSelectSetup,
  bossId,
  bossName,
  bosses,
  onSelectBoss,
  onBackToEvents,
  wclSyncedAt,
  assignments,
  rosterMembers,
  lineupMemberIds,
  specIdByMemberId,
  setupMembers,
  setupUrl,
  abilitySuggestions,
  onSyncWarcraftLogs,
  onAddAssignment,
  onRemoveAssignment,
  onRepositionAssignment
}: RaidPlanningWorkspaceProps) {
  const [view, setView] = useState<
    "timeline" | "list"
  >("timeline");

  const phaseMarkers =
    usePhaseMarkers(bossId);

  const abilityCasts =
    useBossAbilityCasts(bossId);

  const planMembers =
    usePlanMembers(setupId, bossId);

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
    <div className="planning-workspace">
      <PlanningWorkspaceHeader
        bossName={bossName}
        bosses={bosses}
        isPhaseFormOpen={
          isPhaseFormOpen
        }
        isSyncing={isSyncing}
        onBackToEvents={
          onBackToEvents
        }
        onSelectBoss={onSelectBoss}
        onSync={() =>
          void handleSync()
        }
        onSelectSetup={onSelectSetup}
        onTogglePhaseForm={() =>
          setIsPhaseFormOpen(
            (current) => !current
          )
        }
        onViewChange={setView}
        selectedBossId={bossId}
        selectedSetupId={selectedSetupId}
        setups={setups}
        view={view}
        wclSyncedAt={wclSyncedAt}
      />

      {(syncError ||
        planMembers.error) && (
        <StatusMessage type="error">
          {`${syncError ?? planMembers.error}`}
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
          onAddPlanMember={(
            memberId
          ) =>
            void planMembers.addMember(
              memberId
            )
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
          onRemovePlanMember={(
            memberId
          ) =>
            void planMembers.removeMember(
              memberId
            )
          }
          onRepositionAssignment={
            onRepositionAssignment
          }
          phaseMarkers={
            phaseMarkers.markers
          }
          planMemberIds={
            new Set(
              planMembers.members.map(
                (member) =>
                  member.memberId
              )
            )
          }
          rosterMembers={
            rosterMembers
          }
          setupMembers={
            setupMembers
          }
          setupUrl={setupUrl}
          specIdByMemberId={
            specIdByMemberId
          }
        />
      ) : (
        <CooldownBossPanel
          abilitySuggestions={
            abilitySuggestions
          }
          assignments={assignments}
          bossId={bossId}
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
