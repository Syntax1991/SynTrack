import { useState } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { CooldownDisplayCategory } from "../utils/cooldownCategories";
import {
  cooldownCategoryLabels,
  cooldownDisplayCategories,
  groupAssignmentsByPlayer
} from "../utils/cooldownCategories";
import { CooldownCategoryAddFlow } from "./CooldownCategoryAddFlow";
import { CooldownPlanFilterToolbar } from "./CooldownPlanFilterToolbar";
import { CooldownPlayerGroup } from "./CooldownPlayerGroup";

type PendingCreation = {
  rowKey: string;
  seconds: number;
};

type CooldownPlanAreaProps = {
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  selectedMemberId: string | null;
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

const toolbarCategories = cooldownDisplayCategories
  .filter((category) => category !== "Other")
  .map((category) => ({
    category,
    label: cooldownCategoryLabels[category]
  }));

/**
 * Categories here are a filter/creation tool, never the structural
 * owner of a permanent row — that's `CooldownPlayerGroup`, one per
 * player who has at least one real assignment matching the current
 * filter. The player picker lives one level up (`CooldownRosterPanel`,
 * a sibling of the whole timeline, not part of this area) — this
 * component only reads `selectedMemberId`, it never offers its own.
 */
export function CooldownPlanArea({
  assignments,
  rosterMembers,
  lineupMemberIds,
  selectedMemberId,
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

  const categoryFilter =
    activeCategory === "all"
      ? undefined
      : activeCategory;

  const playerGroups =
    groupAssignmentsByPlayer(
      assignments,
      categoryFilter
    );

  const orderedGroups = rosterMembers
    .map((member) => member.id)
    .map((memberId) =>
      playerGroups.find(
        (group) =>
          group.memberId === memberId
      )
    )
    .filter(
      (
        group
      ): group is (typeof playerGroups)[number] =>
        group !== undefined
    );

  const selectedMember = selectedMemberId
    ? rosterMembers.find(
        (member) =>
          member.id === selectedMemberId
      )
    : undefined;

  return (
    <div className="cooldown-plan-area">
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
              cooldownCategoryLabels[
                activeCategory
              ]
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

      {orderedGroups.length === 0 ? (
        <p className="cooldown-plan-empty">
          No{" "}
          {activeCategory === "all"
            ? "cooldowns"
            : cooldownCategoryLabels[
                activeCategory
              ].toLowerCase()}{" "}
          planned yet.
        </p>
      ) : (
        orderedGroups.map((group) => {
          const member =
            rosterMembers.find(
              (candidate) =>
                candidate.id ===
                group.memberId
            );

          if (!member) {
            return null;
          }

          return (
            <CooldownPlayerGroup
              isTooltipSuppressed={
                isTooltipSuppressed
              }
              key={group.memberId}
              lineupMemberIds={
                lineupMemberIds
              }
              member={member}
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
              spellRows={
                group.spellRows
              }
            />
          );
        })
      )}
    </div>
  );
}
