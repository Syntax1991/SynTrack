import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useRoster } from "../../../../guild/web/roster/hooks/useRoster";
import { useTeams } from "../../../../guild/web/teams/hooks/useTeams";
import { GuildVerificationGate } from "../../../../guild/web/verification/components/GuildVerificationGate";
import { useBossRosters } from "../../boss-rosters/hooks/useBossRosters";
import type { RaidBoss } from "../../boss-rosters/types/bossRoster.types";
import { RaidSetupPanel } from "../../raid-setup/components/RaidSetupPanel";
import { useRaidSetup } from "../../raid-setup/hooks/useRaidSetup";
import { useSignups } from "../../signups/hooks/useSignups";
import { BossRosterSection } from "../components/BossRosterSection";
import { RaidEventActionsBar } from "../components/RaidEventActionsBar";
import { useRaidEvents } from "../hooks/useRaidEvents";
import type { RaidEventInput } from "../types/raidEvent.types";

function formatEventSummary(
  event: {
    raidInstance: string;
    difficulty: string;
    scheduledAt: string;
    teamName: string | null;
  }
): string {
  const parts = [
    event.raidInstance,
    event.difficulty,
    new Date(
      event.scheduledAt
    ).toLocaleString(),
    event.teamName ?? "No team"
  ];

  return parts.join(" · ");
}

export function RaidEventDetailPage() {
  const { eventId } =
    useParams<{
      eventId: string;
    }>();

  const navigate = useNavigate();

  const [isEditing, setIsEditing] =
    useState(false);

  const {
    events,
    isLoading: isLoadingEvents,
    updateEvent,
    deleteEvent
  } = useRaidEvents();

  const { teams } = useTeams();

  const { members: rosterMembers } =
    useRoster();

  const {
    setup,
    isLoading: isLoadingSetup,
    isSubmitting: isSubmittingSetup,
    error: setupError,
    addMembers: addSetupMembers,
    removeMember: removeSetupMember,
    updateRosterFromTeam
  } = useRaidSetup(eventId ?? null);

  const {
    bosses,
    isLoading: isLoadingBosses,
    error: bossError,
    addBoss,
    removeBoss,
    setEntry,
    clearEntry,
    setSpec
  } = useBossRosters(
    eventId ?? null,
    setup?.id ?? null
  );

  const {
    entries,
    error: signupError
  } = useSignups(eventId ?? null);

  const event =
    events.find(
      (candidate) =>
        candidate.id === eventId
    ) ?? null;

  const handleUpdate = async (
    input: RaidEventInput
  ) => {
    if (!event) {
      return;
    }

    await updateEvent(
      event.id,
      input
    );

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!event) {
      return;
    }

    const confirmed = window.confirm(
      `${event.title} delete?`
    );

    if (!confirmed) {
      return;
    }

    await deleteEvent(event.id);
    navigate("/raid/planner");
  };

  const handleDeleteBoss = async (
    boss: RaidBoss
  ) => {
    const confirmed = window.confirm(
      `${boss.name} delete?`
    );

    if (!confirmed) {
      return;
    }

    await removeBoss(boss.id);
  };

  if (isLoadingEvents) {
    return <LoadingPanel />;
  }

  if (!event) {
    return (
      <>
        <PageHeader
          description="This scheduled raid no longer exists."
          eyebrow="RAID"
          title="Raid not found"
        />

        <Link
          className="button button-secondary"
          to="/raid/planner"
        >
          Back to Raid Planner
        </Link>
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <Link
            className="button button-secondary"
            to="/raid/planner"
          >
            Back to Raid Planner
          </Link>
        }
        description={formatEventSummary(
          event
        )}
        eyebrow="RAID"
        title={event.title}
      />

      {(bossError ||
        signupError ||
        setupError) && (
        <StatusMessage type="error">
          {`${bossError ?? signupError ?? setupError}`}
        </StatusMessage>
      )}

      <GuildVerificationGate>
        <RaidEventActionsBar
          event={event}
          isEditing={isEditing}
          onDelete={() => {
            void handleDelete();
          }}
          onSubmit={
            handleUpdate
          }
          onToggleEdit={() =>
            setIsEditing(
              (current) =>
                !current
            )
          }
          teams={teams}
        />

        <RaidSetupPanel
          hasLinkedTeam={Boolean(
            event.teamId
          )}
          isLoading={
            isLoadingSetup
          }
          isSubmitting={
            isSubmittingSetup
          }
          onAddMember={(
            memberId
          ) => {
            void addSetupMembers([
              memberId
            ]);
          }}
          onRemoveMember={(
            memberId
          ) => {
            void removeSetupMember(
              memberId
            );
          }}
          onUpdateRosterFromTeam={() => {
            void updateRosterFromTeam();
          }}
          rosterMembers={
            rosterMembers
          }
          setup={setup}
        />

        <BossRosterSection
          bosses={bosses}
          isLoading={
            isLoadingBosses
          }
          onAddBoss={addBoss}
          onClearStatus={(
            bossId,
            memberId
          ) => {
            void clearEntry(
              bossId,
              memberId
            );
          }}
          onDeleteBoss={(
            boss
          ) => {
            void handleDeleteBoss(
              boss
            );
          }}
          onSetSpec={(
            bossId,
            memberId,
            specId
          ) => {
            void setSpec(
              bossId,
              memberId,
              specId
            );
          }}
          onSetStatus={(
            bossId,
            memberId,
            status
          ) => {
            void setEntry(
              bossId,
              memberId,
              status
            );
          }}
          poolMemberIds={
            new Set(
              (setup?.members ??
                []
              ).map(
                (member) =>
                  member.memberId
              )
            )
          }
          rosterMembers={
            rosterMembers
          }
          signupEntries={
            entries
          }
        />
      </GuildVerificationGate>
    </>
  );
}
