import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type { RaidCooldownSpellCategory } from "../../../shared/catalog/raidCooldownSpellCatalog";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { CooldownSpellRow } from "../utils/cooldownCategories";
import { isAssignedMemberInLineup } from "../utils/timelineFormat";
import { RaiderCooldownRow } from "./RaiderCooldownRow";

type PendingCreation = {
  rowKey: string;
  seconds: number;
};

type CooldownCategoryRowsProps = {
  label: string;
  spellRows: Array<
    CooldownSpellRow<RaidCooldownAssignment>
  >;
  categoryFilter?: RaidCooldownSpellCategory;
  /** Only true when this is the single, explicitly-selected category. */
  showEmptyState: boolean;
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
 * A compact, read-only-shaped category block — a header plus one row
 * per real (member, spell) pair. Rows stay directly click-to-create
 * (adding another instance of that same row's spell) in every filter
 * state; the "add a brand-new player/spell" surface lives one level
 * up in `CooldownCategoryAddFlow`, shown only for the single actively
 * selected category, never per block.
 */
export function CooldownCategoryRows({
  label,
  spellRows,
  categoryFilter,
  showEmptyState,
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
}: CooldownCategoryRowsProps) {
  const memberById = new Map(
    rosterMembers.map((member) => [
      member.id,
      member
    ])
  );

  const orderedSpellRows =
    [...spellRows].sort(
      (a, b) =>
        rosterMembers.findIndex(
          (member) =>
            member.id === a.memberId
        ) -
        rosterMembers.findIndex(
          (member) =>
            member.id === b.memberId
        )
    );

  if (
    orderedSpellRows.length === 0 &&
    !showEmptyState
  ) {
    return null;
  }

  return (
    <div className="cooldown-category-section">
      <span className="cooldown-category-header">
        {label}
      </span>

      {orderedSpellRows.length ===
        0 && (
        <p className="cooldown-category-empty">
          No {label.toLowerCase()}{" "}
          assigned.
        </p>
      )}

      {orderedSpellRows.map((row) => {
        const member = memberById.get(
          row.memberId
        );

        if (!member) {
          return null;
        }

        return (
          <RaiderCooldownRow
            assignments={
              row.assignments
            }
            categoryFilter={
              categoryFilter
            }
            isInLineup={isAssignedMemberInLineup(
              row.memberId,
              lineupMemberIds
            )}
            isTooltipSuppressed={
              isTooltipSuppressed
            }
            key={row.key}
            label={
              <span className="cooldown-spell-row-label">
                {row.abilityIcon && (
                  <img
                    alt=""
                    className="cooldown-spell-row-icon"
                    src={
                      row.abilityIcon
                    }
                  />
                )}

                <span className="cooldown-spell-row-text">
                  <span className="cooldown-spell-row-spell">
                    {
                      row.abilityName
                    }
                  </span>

                  <span className="cooldown-spell-row-member">
                    {member.name}
                  </span>
                </span>
              </span>
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
            onTrackClick={(
              seconds
            ) =>
              onRowClick(
                row.key,
                seconds
              )
            }
            pendingCreationSeconds={
              pendingCreation?.rowKey ===
              row.key
                ? pendingCreation.seconds
                : null
            }
            planningDurationSeconds={
              planningDurationSeconds
            }
          />
        );
      })}
    </div>
  );
}
