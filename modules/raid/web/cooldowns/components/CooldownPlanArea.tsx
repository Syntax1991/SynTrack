import { useState, type CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { CooldownDisplayCategory } from "../utils/cooldownCategories";
import {
  cooldownCategoryLabels,
  cooldownDisplayCategories
} from "../utils/cooldownCategories";
import {
  buildPlayerPlanLanes,
  isLaneVisible,
  isPlayerVisible,
  type PlayerPlanLane
} from "../utils/cooldownPlannerFilters";
import { CooldownPlanFilterToolbar } from "./CooldownPlanFilterToolbar";
import { CooldownPlayerGroup } from "./CooldownPlayerGroup";

type CooldownPlanAreaProps = {
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  specIdByMemberId: Map<string, number | null>;
  planMemberIds: Set<string>;
  selectedMemberId: string | null;
  hiddenMemberIds: Set<string>;
  hiddenSpellIdsByMember: Map<string, Set<number>>;
  planningDurationSeconds: number;
  isTooltipSuppressed: boolean;
  onCreateAssignment: (
    input: RaidCooldownAssignmentInput
  ) => void;
  onRemoveAssignment: (
    assignmentId: string
  ) => void;
  onRepositionAssignment: (
    assignment: RaidCooldownAssignment,
    seconds: number
  ) => void;
  onDragPreview: (
    seconds: number | null
  ) => void;
};

const toolbarCategories = cooldownDisplayCategories
  .filter((category) => category !== "Other")
  .map((category) => ({
    category,
    label: cooldownCategoryLabels[category]
  }));

const emptySpellIdSet = new Set<number>();

/**
 * A Cooldown Plan Participant (planMemberIds, plus anyone with a real
 * assignment as a safety net even if the plan-member row is somehow
 * missing) always gets a real player group here — every one of their
 * real class spells becomes a lane via buildPlayerPlanLanes, with or
 * without an assignment yet. This is the core correction from the
 * old "only render players with real assignments" rule: a freshly
 * Added-to-Timeline player with zero markers is a valid, permanent
 * state, not something that collapses into a generic empty message.
 */
export function CooldownPlanArea({
  assignments,
  rosterMembers,
  lineupMemberIds,
  specIdByMemberId,
  planMemberIds,
  selectedMemberId,
  hiddenMemberIds,
  hiddenSpellIdsByMember,
  planningDurationSeconds,
  isTooltipSuppressed,
  onCreateAssignment,
  onRemoveAssignment,
  onRepositionAssignment,
  onDragPreview
}: CooldownPlanAreaProps) {
  const [activeCategory, setActiveCategory] =
    useState<
      CooldownDisplayCategory | "all"
    >("all");

  const [
    alwaysShowAssigned,
    setAlwaysShowAssigned
  ] = useState(false);

  const assignedMemberIds = new Set(
    assignments.map(
      (assignment) => assignment.memberId
    )
  );

  const participantMemberIds = new Set([
    ...planMemberIds,
    ...assignedMemberIds
  ]);

  const participants = rosterMembers.filter(
    (member) =>
      participantMemberIds.has(member.id)
  );

  const visibleParticipants =
    participants.filter((member) =>
      isPlayerVisible(
        member.id,
        assignedMemberIds.has(member.id),
        {
          selectedMemberId,
          hiddenMemberIds,
          alwaysShowAssigned
        }
      )
    );

  const renderableGroups = visibleParticipants
    .map((member) => {
      const lanes = buildPlayerPlanLanes(
        member.id,
        member.className,
        specIdByMemberId.get(member.id) ??
          null,
        assignments
      );

      const hiddenSpellIds =
        hiddenSpellIdsByMember.get(
          member.id
        ) ?? emptySpellIdSet;

      const visibleLanes = lanes.filter(
        (lane) =>
          isLaneVisible(lane, {
            activeCategory,
            hiddenSpellIds,
            alwaysShowAssigned
          })
      );

      if (visibleLanes.length === 0) {
        return null;
      }

      return { member, lanes: visibleLanes };
    })
    .filter(
      (
        entry
      ): entry is {
        member: GuildMember;
        lanes: Array<
          PlayerPlanLane<RaidCooldownAssignment>
        >;
      } => entry !== null
    );

  const selectedMember = selectedMemberId
    ? rosterMembers.find(
        (member) =>
          member.id === selectedMemberId
      )
    : undefined;

  const selectedIsParticipant =
    selectedMemberId !== null &&
    participantMemberIds.has(
      selectedMemberId
    );

  return (
    <div className="cooldown-plan-area">
      <CooldownPlanFilterToolbar
        active={activeCategory}
        alwaysShowAssigned={
          alwaysShowAssigned
        }
        categories={toolbarCategories}
        onChange={setActiveCategory}
        onToggleAlwaysShowAssigned={() =>
          setAlwaysShowAssigned(
            (current) => !current
          )
        }
      />

      {renderableGroups.length === 0 ? (
        selectedMember ? (
          <div
            className="cooldown-plan-player-context"
            style={
              {
                "--marker-color":
                  resolveClassColor(
                    selectedMember.className
                  )
              } as CSSProperties
            }
          >
            <span className="cooldown-plan-player-context-name">
              {selectedMember.name}
            </span>

            <p className="cooldown-plan-empty">
              {selectedIsParticipant
                ? `No ${
                    activeCategory === "all"
                      ? "cooldowns"
                      : cooldownCategoryLabels[
                          activeCategory
                        ].toLowerCase()
                  } to show for this filter.`
                : "Not yet added to this Cooldown Plan — click + next to their name in Timeline Controls to add them."}
            </p>
          </div>
        ) : (
          <p className="cooldown-plan-empty">
            No{" "}
            {activeCategory === "all"
              ? "cooldowns"
              : cooldownCategoryLabels[
                  activeCategory
                ].toLowerCase()}{" "}
            planned yet.
          </p>
        )
      ) : (
        renderableGroups.map(
          ({ member, lanes }) => (
            <CooldownPlayerGroup
              isTooltipSuppressed={
                isTooltipSuppressed
              }
              key={member.id}
              lanes={lanes}
              lineupMemberIds={
                lineupMemberIds
              }
              member={member}
              specId={
                specIdByMemberId.get(
                  member.id
                ) ?? null
              }
              onCreateAssignment={
                onCreateAssignment
              }
              onDragPreview={
                onDragPreview
              }
              onRemoveAssignment={
                onRemoveAssignment
              }
              onRepositionAssignment={
                onRepositionAssignment
              }
              planningDurationSeconds={
                planningDurationSeconds
              }
            />
          )
        )
      )}
    </div>
  );
}
