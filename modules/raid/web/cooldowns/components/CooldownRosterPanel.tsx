import type { CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";

type CooldownRosterPanelProps = {
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
};

/**
 * A compact vertical panel, structurally separate from the shared
 * timeline track region — it never affects the 148px label/track
 * coordinate system every row inside the timeline uses. Every active
 * Boss Setup member (CONFIRMED/TENTATIVE — `lineupMemberIds` already
 * excludes BENCH) stays discoverable here regardless of what's
 * assigned or which category filter is active. Clicking a member
 * only selects them as creation context; it never creates anything.
 */
export function CooldownRosterPanel({
  rosterMembers,
  lineupMemberIds,
  selectedMemberId,
  onSelectMember
}: CooldownRosterPanelProps) {
  const lineupMembers = rosterMembers.filter(
    (member) => lineupMemberIds.has(member.id)
  );

  if (lineupMembers.length === 0) {
    return null;
  }

  return (
    <div className="cooldown-roster-panel">
      <span className="cooldown-roster-panel-label">
        ROSTER
      </span>

      <div className="cooldown-roster-panel-list">
        {lineupMembers.map((member) => (
          <button
            className={
              selectedMemberId === member.id
                ? "cooldown-roster-entry is-selected"
                : "cooldown-roster-entry"
            }
            key={member.id}
            onClick={() =>
              onSelectMember(
                selectedMemberId === member.id
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
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
