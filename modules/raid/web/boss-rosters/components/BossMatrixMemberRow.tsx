import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type {
  RaidBoss,
  RaidBossRosterStatus
} from "../types/bossRoster.types";
import { BossMatrixMemberCell } from "./BossMatrixMemberCell";
import { BossMatrixStatusCell } from "./BossMatrixStatusCell";

type BossMatrixMemberRowProps = {
  member: GuildMember;
  bosses: RaidBoss[];
  presentMemberIds: Set<string>;
  onCellClick: (
    boss: RaidBoss,
    memberId: string,
    currentStatus: RaidBossRosterStatus | null
  ) => void;
  onSetSpec: (
    bossId: string,
    memberId: string,
    specId: number | null
  ) => void;
};

/**
 * One member's full row across every boss column — extracted from
 * BossRosterMatrix purely to stay under the architecture line limit;
 * the "suggested from signup" and status-cycling logic is unchanged.
 */
export function BossMatrixMemberRow({
  member,
  bosses,
  presentMemberIds,
  onCellClick,
  onSetSpec
}: BossMatrixMemberRowProps) {
  return (
    <tr>
      <td>
        <BossMatrixMemberCell
          className={member.className}
          name={member.name}
        />
      </td>

      {bosses.map((boss) => {
        const entry =
          boss.rosterEntries.find(
            (candidate) =>
              candidate.memberId ===
              member.id
          );

        const savedStatus =
          entry?.status ?? null;

        const isSuggested =
          !savedStatus &&
          presentMemberIds.has(
            member.id
          );

        const displayStatus:
          | RaidBossRosterStatus
          | null =
          savedStatus ??
          (isSuggested
            ? "CONFIRMED"
            : null);

        return (
          <BossMatrixStatusCell
            className={
              member.className
            }
            displayStatus={
              displayStatus
            }
            isEntrySaved={
              entry !== undefined
            }
            isSuggested={isSuggested}
            key={boss.id}
            onClick={() =>
              onCellClick(
                boss,
                member.id,
                displayStatus
              )
            }
            onSetSpec={(specId) =>
              onSetSpec(
                boss.id,
                member.id,
                specId
              )
            }
            specId={
              entry?.specId ?? null
            }
          />
        );
      })}
    </tr>
  );
}
