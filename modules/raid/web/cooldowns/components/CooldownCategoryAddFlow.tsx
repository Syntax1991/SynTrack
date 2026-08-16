import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type { RaidCooldownSpellCategory } from "../../../shared/catalog/raidCooldownSpellCatalog";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import { isAssignedMemberInLineup } from "../utils/timelineFormat";
import { RaiderCooldownRow } from "./RaiderCooldownRow";

type PendingCreation = {
  rowKey: string;
  seconds: number;
};

type CooldownCategoryAddFlowProps = {
  category: RaidCooldownSpellCategory;
  categoryLabel: string;
  member: GuildMember;
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
 * Both the player (from the persistent `CooldownPlayerRail`) and the
 * category (from the toolbar) are already known once this renders —
 * neither is asked for again here. Just a single real click-to-create
 * track for that one player, with the spell picker filtered to this
 * category. No internal player picker lives here anymore; that
 * responsibility moved to the rail so there's exactly one roster
 * picker, not a different ad-hoc one per category.
 */
export function CooldownCategoryAddFlow({
  category,
  categoryLabel,
  member,
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
}: CooldownCategoryAddFlowProps) {
  const rowKey = `${category}::${member.id}::new`;

  return (
    <div className="cooldown-plan-add-row">
      <span className="cooldown-plan-add-label">
        Add to {categoryLabel}:
      </span>

      <RaiderCooldownRow
        assignments={[]}
        categoryFilter={category}
        isInLineup={isAssignedMemberInLineup(
          member.id,
          lineupMemberIds
        )}
        isTooltipSuppressed={
          isTooltipSuppressed
        }
        member={member}
        onCancelCreate={onCancelCreate}
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
          onRowClick(rowKey, seconds)
        }
        pendingCreationSeconds={
          pendingCreation?.rowKey ===
          rowKey
            ? pendingCreation.seconds
            : null
        }
        planningDurationSeconds={
          planningDurationSeconds
        }
      />
    </div>
  );
}
