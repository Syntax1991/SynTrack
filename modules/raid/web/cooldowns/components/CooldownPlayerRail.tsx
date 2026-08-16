import type { CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";

type CooldownPlayerRailProps = {
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
};

/**
 * Every active Boss Setup member (CONFIRMED/TENTATIVE — `lineupMemberIds`
 * already excludes BENCH, the same set every other lineup-aware part
 * of the timeline already uses) stays discoverable here, compactly,
 * regardless of which category is selected below. This is the ONLY
 * player picker — category selection never swaps in a different,
 * category-filtered roster subset. Clicking a player only selects
 * them as the creation context; it never creates anything on its own.
 */
export function CooldownPlayerRail({
  rosterMembers,
  lineupMemberIds,
  selectedMemberId,
  onSelectMember
}: CooldownPlayerRailProps) {
  const lineupMembers = rosterMembers.filter(
    (member) => lineupMemberIds.has(member.id)
  );

  if (lineupMembers.length === 0) {
    return null;
  }

  return (
    <div className="cooldown-player-rail">
      <span className="cooldown-player-rail-label">
        PLAYERS
      </span>

      <div className="cooldown-player-rail-scroll">
        {lineupMembers.map((member) => (
          <button
            className={
              selectedMemberId === member.id
                ? "cooldown-player-chip is-selected"
                : "cooldown-player-chip"
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
