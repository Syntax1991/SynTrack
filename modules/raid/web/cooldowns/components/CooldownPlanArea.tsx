import { useState } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { CooldownDisplayCategory } from "../utils/cooldownCategories";
import { groupAssignmentsByCategory } from "../utils/cooldownCategories";
import { CooldownCategoryAddFlow } from "./CooldownCategoryAddFlow";
import { CooldownCategoryRows } from "./CooldownCategoryRows";
import { CooldownPlanFilterToolbar } from "./CooldownPlanFilterToolbar";
import { CooldownPlayerRail } from "./CooldownPlayerRail";

type PendingCreation = {
  rowKey: string;
  seconds: number;
};

type CooldownPlanAreaProps = {
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  planningDurationSeconds: number;
  isTooltipSuppressed: boolean;
  pendingCreation: PendingCreation | null;
  onRowClick: (
    rowKey: string,
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
 * Two layers, deliberately kept separate: the persistent
 * `CooldownPlayerRail` (every active Setup member, always visible,
 * compact — the ONE roster picker) and the cooldown-plan rows below
 * (only real assignments ever consume a full Timeline lane). A
 * player never disappears for lacking a cooldown; they just never
 * get a lane for one until they actually have it. Creation needs
 * both a selected player (rail) and a selected category (toolbar) —
 * whichever is picked second reveals the one temporary click-to-
 * create lane for that combination.
 */
export function CooldownPlanArea({
  assignments,
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
}: CooldownPlanAreaProps) {
  const [activeCategory, setActiveCategory] =
    useState<
      CooldownDisplayCategory | "all"
    >("all");

  const [
    selectedMemberId,
    setSelectedMemberId
  ] = useState<string | null>(null);

  const categoryGroups =
    groupAssignmentsByCategory(
      assignments
    );

  const toolbarCategories = categoryGroups
    .filter(
      (group) => group.category !== "Other"
    )
    .map((group) => ({
      category: group.category,
      label: group.label
    }));

  const visibleGroups =
    activeCategory === "all"
      ? categoryGroups.filter(
          (group) =>
            group.spellRows.length > 0
        )
      : categoryGroups.filter(
          (group) =>
            group.category ===
            activeCategory
        );

  const selectedMember = selectedMemberId
    ? rosterMembers.find(
        (member) =>
          member.id === selectedMemberId
      )
    : undefined;

  return (
    <div className="cooldown-plan-area">
      <CooldownPlayerRail
        lineupMemberIds={
          lineupMemberIds
        }
        onSelectMember={
          setSelectedMemberId
        }
        rosterMembers={rosterMembers}
        selectedMemberId={
          selectedMemberId
        }
      />

      <CooldownPlanFilterToolbar
        active={activeCategory}
        categories={toolbarCategories}
        onChange={setActiveCategory}
      />

      {selectedMember &&
        activeCategory !== "all" &&
        activeCategory !== "Other" && (
          <CooldownCategoryAddFlow
            category={activeCategory}
            categoryLabel={
              categoryGroups.find(
                (group) =>
                  group.category ===
                  activeCategory
              )?.label ?? activeCategory
            }
            isTooltipSuppressed={
              isTooltipSuppressed
            }
            lineupMemberIds={
              lineupMemberIds
            }
            member={selectedMember}
            onCancelCreate={
              onCancelCreate
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
            onRowClick={onRowClick}
            pendingCreation={
              pendingCreation
            }
            planningDurationSeconds={
              planningDurationSeconds
            }
          />
        )}

      {visibleGroups.map((group) => (
        <CooldownCategoryRows
          categoryFilter={
            group.category !== "Other"
              ? group.category
              : undefined
          }
          isTooltipSuppressed={
            isTooltipSuppressed
          }
          key={group.category}
          label={group.label}
          lineupMemberIds={
            lineupMemberIds
          }
          onCancelCreate={
            onCancelCreate
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
          onRowClick={onRowClick}
          pendingCreation={
            pendingCreation
          }
          planningDurationSeconds={
            planningDurationSeconds
          }
          rosterMembers={
            rosterMembers
          }
          showEmptyState={
            activeCategory !== "all"
          }
          spellRows={
            group.spellRows
          }
        />
      ))}
    </div>
  );
}
