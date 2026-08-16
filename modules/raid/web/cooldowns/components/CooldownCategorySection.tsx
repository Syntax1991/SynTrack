import { useState, type CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import { getSpellsForClass } from "../../../shared/catalog/raidCooldownSpellCatalog";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { CooldownDisplayCategory } from "../utils/cooldownCategories";
import { isAssignedMemberInLineup } from "../utils/timelineFormat";
import { RaiderCooldownRow } from "./RaiderCooldownRow";

type MemberGroup = {
  memberId: string;
  assignments: RaidCooldownAssignment[];
};

type PendingCreation = {
  memberId: string;
  category: CooldownDisplayCategory;
  seconds: number;
};

type CooldownCategorySectionProps = {
  category: CooldownDisplayCategory;
  label: string;
  memberGroups: MemberGroup[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  planningDurationSeconds: number;
  isTooltipSuppressed: boolean;
  pendingCreation: PendingCreation | null;
  onRowClick: (
    memberId: string,
    category: CooldownDisplayCategory,
    seconds: number
  ) => void;
  onCreateAssignment: (
    input: RaidCooldownAssignmentInput
  ) => void;
  onCancelCreate: () => void;
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

/**
 * Rows here are strictly assignment-driven — a member only gets a
 * persistent row if they hold a real assignment in this category.
 * `getSpellsForClass` only ever picks which not-yet-assigned lineup
 * members appear as compact chips below the real rows; it never
 * creates a permanent empty row on its own. Clicking a chip reveals
 * a real clickable track for that one member so the existing click-
 * to-create interaction still works unchanged — no player dropdown.
 */
export function CooldownCategorySection({
  category,
  label,
  memberGroups,
  rosterMembers,
  lineupMemberIds,
  planningDurationSeconds,
  isTooltipSuppressed,
  pendingCreation,
  onRowClick,
  onCreateAssignment,
  onCancelCreate,
  onRemoveAssignment,
  onRepositionAssignment,
  onDragPreview
}: CooldownCategorySectionProps) {
  const [
    activatedMemberId,
    setActivatedMemberId
  ] = useState<string | null>(null);

  const memberById = new Map(
    rosterMembers.map((member) => [
      member.id,
      member
    ])
  );

  const groupByMemberId = new Map(
    memberGroups.map((group) => [
      group.memberId,
      group
    ])
  );

  const orderedRealMemberIds =
    rosterMembers
      .map((member) => member.id)
      .filter((id) =>
        groupByMemberId.has(id)
      );

  // "Other" has no catalog category to check eligibility against —
  // free-text assignments aren't something a member is "eligible"
  // for, so it never gets a chip row, only real rows.
  const eligibleChipMembers =
    category === "Other"
      ? []
      : rosterMembers.filter(
          (member) =>
            lineupMemberIds.has(
              member.id
            ) &&
            !groupByMemberId.has(
              member.id
            ) &&
            getSpellsForClass(
              member.className
            ).some(
              (spell) =>
                spell.category ===
                category
            )
        );

  const activatedMember =
    activatedMemberId &&
    !groupByMemberId.has(
      activatedMemberId
    )
      ? memberById.get(
          activatedMemberId
        )
      : undefined;

  if (
    orderedRealMemberIds.length ===
      0 &&
    eligibleChipMembers.length === 0
  ) {
    return null;
  }

  const renderRow = (
    member: GuildMember,
    assignments: RaidCooldownAssignment[]
  ) => (
    <RaiderCooldownRow
      assignments={assignments}
      isInLineup={isAssignedMemberInLineup(
        member.id,
        lineupMemberIds
      )}
      isTooltipSuppressed={
        isTooltipSuppressed
      }
      key={member.id}
      member={member}
      onCancelCreate={() => {
        onCancelCreate();
        setActivatedMemberId(null);
      }}
      onCreateAssignment={
        onCreateAssignment
      }
      onDragPreview={onDragPreview}
      onRemoveAssignment={
        onRemoveAssignment
      }
      onRepositionAssignment={
        onRepositionAssignment
      }
      onTrackClick={(seconds) =>
        onRowClick(
          member.id,
          category,
          seconds
        )
      }
      pendingCreationSeconds={
        pendingCreation?.memberId ===
          member.id &&
        pendingCreation.category ===
          category
          ? pendingCreation.seconds
          : null
      }
      planningDurationSeconds={
        planningDurationSeconds
      }
    />
  );

  return (
    <div className="cooldown-category-section">
      <div className="cooldown-category-header">
        {label}
      </div>

      {orderedRealMemberIds.map(
        (memberId) => {
          const member =
            memberById.get(memberId);

          const group =
            groupByMemberId.get(
              memberId
            );

          if (!member || !group) {
            return null;
          }

          return renderRow(
            member,
            group.assignments
          );
        }
      )}

      {eligibleChipMembers.length >
        0 && (
        <div className="cooldown-category-chip-row">
          {eligibleChipMembers.map(
            (member) => (
              <button
                className={
                  activatedMemberId ===
                  member.id
                    ? "cooldown-category-chip is-active"
                    : "cooldown-category-chip"
                }
                key={member.id}
                onClick={() =>
                  setActivatedMemberId(
                    (current) =>
                      current ===
                      member.id
                        ? null
                        : member.id
                  )
                }
                style={
                  {
                    "--marker-color":
                      resolveClassColor(
                        member.className
                      )
                  } as CSSProperties
                }
                type="button"
              >
                <span className="cooldown-category-chip-dot" />
                {member.name}
              </button>
            )
          )}
        </div>
      )}

      {activatedMember &&
        renderRow(activatedMember, [])}
    </div>
  );
}
