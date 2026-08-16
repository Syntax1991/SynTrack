import { Fragment, useState } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import {
  ROLE_LABELS,
  ROLE_ORDER,
  resolveRoleKey
} from "../../../../guild/web/roster/utils/rosterRoles";
import { BossMatrixFooter } from "./BossMatrixFooter";
import { BossMatrixHeader } from "./BossMatrixHeader";
import { BossMatrixMemberRow } from "./BossMatrixMemberRow";
import { BossForm } from "./BossForm";
import type {
  RaidBoss,
  RaidBossInput,
  RaidBossRosterStatus
} from "../types/bossRoster.types";
import type { RaidSignupEntry } from "../../signups/types/signup.types";

type BossRosterMatrixProps = {
  bosses: RaidBoss[];
  rosterMembers: GuildMember[];
  poolMemberIds: Set<string>;
  signupEntries: RaidSignupEntry[];
  onAddBoss: (
    input: RaidBossInput
  ) => Promise<void>;
  onDeleteBoss: (
    boss: RaidBoss
  ) => void;
  onSetStatus: (
    bossId: string,
    memberId: string,
    status: RaidBossRosterStatus
  ) => void;
  onClearStatus: (
    bossId: string,
    memberId: string
  ) => void;
  onSetSpec: (
    bossId: string,
    memberId: string,
    specId: number | null
  ) => void;
};

const cycleOrder: Array<
  RaidBossRosterStatus | null
> = [
  null,
  "CONFIRMED",
  "TENTATIVE",
  "BENCH"
];

export function BossRosterMatrix({
  bosses,
  rosterMembers,
  poolMemberIds,
  signupEntries,
  onAddBoss,
  onDeleteBoss,
  onSetStatus,
  onClearStatus,
  onSetSpec
}: BossRosterMatrixProps) {
  const [
    isAddFormOpen,
    setIsAddFormOpen
  ] = useState(false);

  const presentMemberIds = new Set(
    signupEntries
      .filter(
        (entry) =>
          entry.status ===
          "PRESENT"
      )
      .map(
        (entry) =>
          entry.member.id
      )
  );

  const handleCellClick = (
    boss: RaidBoss,
    memberId: string,
    currentStatus:
      | RaidBossRosterStatus
      | null
  ) => {
    const currentIndex =
      cycleOrder.indexOf(
        currentStatus
      );

    const nextStatus =
      cycleOrder[
        (currentIndex + 1) %
          cycleOrder.length
      ];

    if (nextStatus === null) {
      onClearStatus(
        boss.id,
        memberId
      );

      return;
    }

    onSetStatus(
      boss.id,
      memberId,
      nextStatus
    );
  };

  if (rosterMembers.length === 0) {
    return (
      <p className="muted-text">
        The guild roster is empty.
      </p>
    );
  }

  const poolMembers =
    rosterMembers.filter((member) =>
      poolMemberIds.has(member.id)
    );

  const groupedMembers = ROLE_ORDER.map(
    (roleKey) => ({
      roleKey,
      members:
        poolMembers.filter(
          (member) =>
            resolveRoleKey(
              member.role
            ) === roleKey
        )
    })
  ).filter(
    (group) =>
      group.members.length > 0
  );

  return (
    <div>
      <div className="boss-matrix-toolbar">
        <button
          className="button button-secondary"
          onClick={() =>
            setIsAddFormOpen(
              (current) =>
                !current
            )
          }
          type="button"
        >
          {isAddFormOpen
            ? "Cancel"
            : "+ Add boss"}
        </button>
      </div>

      {isAddFormOpen && (
        <BossForm
          onSubmit={async (
            input
          ) => {
            await onAddBoss(
              input
            );

            setIsAddFormOpen(
              false
            );
          }}
        />
      )}

      {poolMembers.length === 0 ? (
        <p className="muted-text">
          No members in this Setup's
          pool yet. Add members via
          the Setup Roster panel
          above before assigning
          them to bosses.
        </p>
      ) : bosses.length === 0 ? (
        <p className="muted-text">
          No bosses yet. Pick a
          catalog raid instance
          when scheduling to
          auto-fill encounters, or
          add one above.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="boss-matrix-table">
            <BossMatrixHeader
              bosses={bosses}
              onDeleteBoss={
                onDeleteBoss
              }
            />

            <tbody>
              {groupedMembers.map(
                (group) => (
                  <Fragment
                    key={
                      group.roleKey
                    }
                  >
                    <tr>
                      <td
                        className="boss-matrix-role-header"
                        colSpan={
                          bosses.length +
                          1
                        }
                      >
                        {
                          ROLE_LABELS[
                            group
                              .roleKey
                          ]
                        }{" "}
                        (
                        {
                          group
                            .members
                            .length
                        }
                        )
                      </td>
                    </tr>

                    {group.members.map(
                      (member) => (
                        <BossMatrixMemberRow
                          bosses={
                            bosses
                          }
                          key={
                            member.id
                          }
                          member={
                            member
                          }
                          onCellClick={
                            handleCellClick
                          }
                          onSetSpec={
                            onSetSpec
                          }
                          presentMemberIds={
                            presentMemberIds
                          }
                        />
                      )
                    )}
                  </Fragment>
                )
              )}
            </tbody>

            <BossMatrixFooter
              bosses={bosses}
              poolMemberIds={
                poolMemberIds
              }
            />
          </table>
        </div>
      )}
    </div>
  );
}
