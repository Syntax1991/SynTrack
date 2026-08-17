import { useState } from "react";
import type { CSSProperties } from "react";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { SetupSelector } from "./SetupSelector";
import type { RaidSetup } from "../types/raidSetup.types";

type RaidSetupPanelProps = {
  setup: RaidSetup | null;
  setups: RaidSetup[];
  selectedSetupId: string | null;
  onSelectSetup: (setupId: string) => void;
  onCreateSetup: (name: string) => Promise<void>;
  isLoading: boolean;
  isSubmitting: boolean;
  rosterMembers: GuildMember[];
  hasLinkedTeam: boolean;
  onAddMember: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateRosterFromTeam: () => void;
};

export function RaidSetupPanel({
  setup,
  setups,
  selectedSetupId,
  onSelectSetup,
  onCreateSetup,
  isLoading,
  isSubmitting,
  rosterMembers,
  hasLinkedTeam,
  onAddMember,
  onRemoveMember,
  onUpdateRosterFromTeam
}: RaidSetupPanelProps) {
  const [
    selectedMemberId,
    setSelectedMemberId
  ] = useState("");

  if (isLoading || !setup) {
    return null;
  }

  const poolMemberIds = new Set(
    setup.members.map(
      (entry) => entry.memberId
    )
  );

  const availableMembers =
    rosterMembers.filter(
      (member) =>
        !poolMemberIds.has(member.id)
    );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            SETUP ROSTER
          </p>

          <h2>
            {setup.name} ·{" "}
            {setup.members.length}{" "}
            members
          </h2>
        </div>

        <button
          className="button button-secondary"
          disabled={
            !hasLinkedTeam ||
            isSubmitting
          }
          onClick={
            onUpdateRosterFromTeam
          }
          title={
            hasLinkedTeam
              ? "Add every current member of the linked team that isn't in this Setup's pool yet."
              : "Link a team to this event to sync its roster."
          }
          type="button"
        >
          Update Roster
        </button>
      </div>

      <SetupSelector
        isSubmitting={isSubmitting}
        onCreate={onCreateSetup}
        onSelect={onSelectSetup}
        selectedSetupId={selectedSetupId}
        setups={setups}
      />

      {setup.members.length === 0 ? (
        <p className="muted-text">
          No members in this Setup's
          pool yet.
        </p>
      ) : (
        <ul className="team-member-list">
          {setup.members.map(
            (entry) => (
              <li key={entry.id}>
                <span
                  style={
                    {
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "8px"
                    } as CSSProperties
                  }
                >
                  <span
                    style={
                      {
                        width: "8px",
                        height: "8px",
                        borderRadius:
                          "999px",
                        background:
                          entry.member
                            ? resolveClassColor(
                                entry
                                  .member
                                  .className
                              )
                            : "#9DA5B7",
                        display:
                          "inline-block"
                      } as CSSProperties
                    }
                  />

                  {entry.member
                    ?.name ??
                    "Unknown member"}
                </span>

                <button
                  className="text-button danger"
                  onClick={() =>
                    onRemoveMember(
                      entry.memberId
                    )
                  }
                  type="button"
                >
                  Remove
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {availableMembers.length > 0 && (
        <div className="team-member-picker">
          <select
            onChange={(event) =>
              setSelectedMemberId(
                event.target.value
              )
            }
            value={selectedMemberId}
          >
            <option value="">
              Select member…
            </option>

            {availableMembers.map(
              (member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.name} (
                  {member.className})
                </option>
              )
            )}
          </select>

          <button
            className="button button-secondary"
            disabled={
              !selectedMemberId ||
              isSubmitting
            }
            onClick={() => {
              onAddMember(
                selectedMemberId
              );

              setSelectedMemberId("");
            }}
            type="button"
          >
            + Member
          </button>
        </div>
      )}
    </section>
  );
}
