import {
  useCallback,
  useEffect,
  useState
} from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useRoster } from "../../../../guild/web/roster/hooks/useRoster";
import { getBossesForSetup } from "../../boss-rosters/api/bossRosterApi";
import type { RaidBoss } from "../../boss-rosters/types/bossRoster.types";
import { RaidEventList } from "../../planner/components/RaidEventList";
import { useRaidEvents } from "../../planner/hooks/useRaidEvents";
import type { RaidEvent } from "../../planner/types/raidEvent.types";
import { useRaidSetup } from "../../raid-setup/hooks/useRaidSetup";
import { syncBossWarcraftLogs } from "../api/cooldownApi";
import { RaidPlanningWorkspace } from "../components/RaidPlanningWorkspace";
import { useCooldownAssignments } from "../hooks/useCooldownAssignments";

export function CooldownsLandingPage() {
  const {
    events,
    isLoading: isLoadingEvents
  } = useRaidEvents();

  const {
    members: rosterMembers
  } = useRoster();

  const [
    selectedEvent,
    setSelectedEvent
  ] = useState<RaidEvent | null>(
    null
  );

  const {
    setup,
    setups,
    selectedSetupId,
    selectSetup,
    error: setupError
  } = useRaidSetup(
    selectedEvent?.id ?? null
  );

  const [bosses, setBosses] =
    useState<RaidBoss[]>([]);

  const [
    selectedBossId,
    setSelectedBossId
  ] = useState<string | null>(null);

  const {
    assignments,
    error: cooldownError,
    addAssignment,
    editAssignment,
    removeAssignment
  } = useCooldownAssignments(
    setup?.id ?? null
  );

  const loadBosses = useCallback(
    async () => {
      if (!setup) {
        setBosses([]);
        return;
      }

      const response =
        await getBossesForSetup(
          setup.id
        );

      setBosses(response.items);

      setSelectedBossId(
        (current) =>
          current ??
          response.items[0]?.id ??
          null
      );
    },
    [setup]
  );

  useEffect(() => {
    void loadBosses();
  }, [loadBosses]);

  const selectedBoss = bosses.find(
    (boss) =>
      boss.id === selectedBossId
  );

  const lineupMemberIds = new Set(
    (
      selectedBoss?.rosterEntries ??
      []
    )
      .filter(
        (entry) =>
          entry.status !== "BENCH"
      )
      .map(
        (entry) => entry.memberId
      )
  );

  const specIdByMemberId = new Map(
    (
      selectedBoss?.rosterEntries ?? []
    ).map((entry) => [
      entry.memberId,
      entry.specId
    ])
  );

  const handleSelectEvent = (
    event: RaidEvent
  ) => {
    setSelectedEvent(event);
    setSelectedBossId(null);
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setBosses([]);
    setSelectedBossId(null);
  };

  return (
    <div>
      {!selectedEvent && (
        <PageHeader
          description="Plan raid cooldowns and healing/defensive assignments per boss."
          eyebrow="RAID"
          title="Cooldowns"
        />
      )}

      {(cooldownError ||
        setupError) && (
        <StatusMessage type="error">
          {`${cooldownError ?? setupError}`}
        </StatusMessage>
      )}

      {isLoadingEvents ? (
        <LoadingPanel />
      ) : !selectedEvent ? (
        <RaidEventList
          events={events}
          onSelect={
            handleSelectEvent
          }
        />
      ) : selectedBoss && setup ? (
        <RaidPlanningWorkspace
          abilitySuggestions={Array.from(
            new Set(
              assignments.map(
                (a) =>
                  a.abilityName
              )
            )
          )}
          assignments={assignments.filter(
            (assignment) =>
              assignment.bossId ===
              selectedBoss.id
          )}
          bossId={selectedBoss.id}
          bossName={
            selectedBoss.name
          }
          bosses={bosses}
          lineupMemberIds={
            lineupMemberIds
          }
          onAddAssignment={
            addAssignment
          }
          onBackToEvents={
            handleBackToEvents
          }
          onRemoveAssignment={(
            assignmentId
          ) => {
            void removeAssignment(
              selectedBoss.id,
              assignmentId
            );
          }}
          onRepositionAssignment={(
            assignment,
            seconds
          ) => {
            void editAssignment(
              selectedBoss.id,
              assignment.id,
              {
                memberId:
                  assignment.memberId,
                abilityName:
                  assignment.abilityName,
                spellId:
                  assignment.spellId,
                abilityIcon:
                  assignment.abilityIcon,
                phaseLabel:
                  assignment.phaseLabel,
                timestampSeconds:
                  seconds,
                sortOrder:
                  assignment.sortOrder
              }
            );
          }}
          onSelectBoss={
            setSelectedBossId
          }
          onSyncWarcraftLogs={async () => {
            await syncBossWarcraftLogs(
              selectedBoss.id
            );

            await loadBosses();
          }}
          onSelectSetup={selectSetup}
          rosterMembers={
            rosterMembers
          }
          selectedSetupId={
            selectedSetupId
          }
          setupId={setup.id}
          setupMembers={
            setup.members
          }
          setups={setups}
          specIdByMemberId={
            specIdByMemberId
          }
          setupUrl={`/raid/planner/${selectedEvent.id}`}
          wclSyncedAt={
            selectedBoss.wclSyncedAt
          }
        />
      ) : (
        <LoadingPanel />
      )}
    </div>
  );
}
