import {
  useState,
  type CSSProperties
} from "react";
import { Link } from "react-router-dom";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import type { RaidSetupMember } from "../../raid-setup/types/raidSetup.types";
import { CooldownRosterSpellPanel } from "./CooldownRosterSpellPanel";
import {
  EyeIcon,
  EyeOffIcon,
  SpellSettingsIcon
} from "./CooldownRosterIcons";

type CooldownRosterPanelProps = {
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  setupMembers: RaidSetupMember[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
  hiddenMemberIds: Set<string>;
  onToggleHidden: (memberId: string) => void;
  hiddenSpellIdsByMember: Map<string, Set<number>>;
  onToggleSpellVisibility: (
    memberId: string,
    spellId: number
  ) => void;
  planMemberIds: Set<string>;
  assignedMemberIds: Set<string>;
  onAddPlanMember: (
    memberId: string
  ) => void;
  onRemovePlanMember: (
    memberId: string
  ) => void;
  setupUrl: string;
};

const emptySpellIdSet = new Set<number>();

/**
 * The Cooldown Planner's real control surface: WHO you're currently
 * planning for, WHICH of their spells are in view, and WHO is a
 * Cooldown Plan Participant at all — never WHO plays this boss (that
 * stays exclusively Setup/BossRosterMatrix, reached here only via
 * "Open Setup"). The eye/gear/selection state is local, non-persisted
 * display state; only the +/✓ plan-membership toggle writes anything
 * (RaidCooldownPlanMember, via onAddPlanMember/onRemovePlanMember) —
 * none of this ever touches RaidBossRosterEntry or RaidSetupMember.
 * A name click narrows PLAN to that player (documented WoWUtils
 * behavior: "click a player name to filter spells for that player
 * only"); the gear icon does the same thing but doubles as the
 * discoverable way into the Spells section below. Removing a plan
 * member is disabled whenever they still have real assignments —
 * the server enforces this too, this is just the friendlier UI half.
 */
export function CooldownRosterPanel({
  rosterMembers,
  lineupMemberIds,
  setupMembers,
  selectedMemberId,
  onSelectMember,
  hiddenMemberIds,
  onToggleHidden,
  hiddenSpellIdsByMember,
  onToggleSpellVisibility,
  planMemberIds,
  assignedMemberIds,
  onAddPlanMember,
  onRemovePlanMember,
  setupUrl
}: CooldownRosterPanelProps) {
  const [
    isInactiveExpanded,
    setIsInactiveExpanded
  ] = useState(false);

  const lineupMembers = rosterMembers.filter(
    (member) => lineupMemberIds.has(member.id)
  );

  const inactiveMembers = setupMembers
    .filter(
      (
        setupMember
      ): setupMember is RaidSetupMember & {
        member: GuildMember;
      } =>
        setupMember.member !== null &&
        !lineupMemberIds.has(
          setupMember.memberId
        )
    )
    .map((setupMember) => setupMember.member);

  const selectedMember = selectedMemberId
    ? rosterMembers.find(
        (member) =>
          member.id === selectedMemberId
      )
    : undefined;

  if (
    lineupMembers.length === 0 &&
    inactiveMembers.length === 0
  ) {
    return null;
  }

  const handleSelectToggle = (
    memberId: string
  ) => {
    onSelectMember(
      selectedMemberId === memberId
        ? null
        : memberId
    );
  };

  return (
    <div className="cooldown-roster-panel">
      <div className="cooldown-roster-panel-title">
        TIMELINE CONTROLS
      </div>

      <div className="cooldown-roster-panel-header">
        <span className="cooldown-roster-panel-label">
          Roster
        </span>

        <Link
          className="cooldown-roster-open-setup"
          title="Change who's in on this boss in the dedicated Setup screen"
          to={setupUrl}
        >
          Open Setup
        </Link>
      </div>

      <div className="cooldown-roster-panel-list">
        {lineupMembers.map((member) => {
          const isHidden = hiddenMemberIds.has(
            member.id
          );

          const isSelected =
            selectedMemberId === member.id;

          const rowClassName = [
            "cooldown-roster-entry",
            isHidden ? "is-hidden" : null,
            isSelected ? "is-selected" : null
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              className={rowClassName}
              key={member.id}
              style={
                {
                  "--marker-color":
                    resolveClassColor(
                      member.className
                    )
                } as CSSProperties
              }
            >
              <button
                className={
                  isSelected
                    ? "cooldown-roster-entry-name is-selected"
                    : "cooldown-roster-entry-name"
                }
                onClick={() =>
                  handleSelectToggle(
                    member.id
                  )
                }
                type="button"
              >
                {member.name}
              </button>

              <button
                aria-label={
                  isHidden
                    ? `Show ${member.name} in PLAN`
                    : `Hide ${member.name} from PLAN`
                }
                className="cooldown-roster-entry-visibility"
                onClick={() =>
                  onToggleHidden(member.id)
                }
                title={
                  isHidden
                    ? "Hidden from PLAN — click to show"
                    : "Visible in PLAN — click to hide"
                }
                type="button"
              >
                {isHidden ? (
                  <EyeOffIcon />
                ) : (
                  <EyeIcon />
                )}
              </button>

              <button
                aria-label={`Open ${member.name}'s spell controls`}
                className={
                  isSelected
                    ? "cooldown-roster-entry-visibility is-selected"
                    : "cooldown-roster-entry-visibility"
                }
                onClick={() =>
                  handleSelectToggle(
                    member.id
                  )
                }
                title="Spell visibility for this player"
                type="button"
              >
                <SpellSettingsIcon />
              </button>

              {(() => {
                const isPlanMember =
                  planMemberIds.has(
                    member.id
                  );

                const hasAssignments =
                  assignedMemberIds.has(
                    member.id
                  );

                if (!isPlanMember) {
                  return (
                    <button
                      aria-label={`Add ${member.name} to the Cooldown Plan`}
                      className="cooldown-roster-entry-plan-toggle"
                      onClick={() =>
                        onAddPlanMember(
                          member.id
                        )
                      }
                      title="Add to Timeline"
                      type="button"
                    >
                      +
                    </button>
                  );
                }

                return (
                  <button
                    aria-label={`Remove ${member.name} from the Cooldown Plan`}
                    className="cooldown-roster-entry-plan-toggle is-in-plan"
                    disabled={
                      hasAssignments
                    }
                    onClick={() =>
                      onRemovePlanMember(
                        member.id
                      )
                    }
                    title={
                      hasAssignments
                        ? "Remove assignments before removing this player from the timeline."
                        : "Remove from Timeline"
                    }
                    type="button"
                  >
                    ✓
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>

      {selectedMember && (
        <CooldownRosterSpellPanel
          hiddenSpellIds={
            hiddenSpellIdsByMember.get(
              selectedMember.id
            ) ?? emptySpellIdSet
          }
          member={selectedMember}
          onToggleSpell={(spellId) =>
            onToggleSpellVisibility(
              selectedMember.id,
              spellId
            )
          }
        />
      )}

      {inactiveMembers.length > 0 && (
        <div className="cooldown-roster-inactive">
          <button
            aria-expanded={
              isInactiveExpanded
            }
            className="cooldown-roster-inactive-toggle"
            onClick={() =>
              setIsInactiveExpanded(
                (current) => !current
              )
            }
            type="button"
          >
            {isInactiveExpanded
              ? "▾"
              : "▸"}{" "}
            INACTIVE (
            {inactiveMembers.length})
          </button>

          {isInactiveExpanded && (
            <ul className="cooldown-roster-inactive-list">
              {inactiveMembers.map(
                (member) => (
                  <li
                    key={member.id}
                    style={
                      {
                        "--marker-color":
                          resolveClassColor(
                            member.className
                          )
                      } as CSSProperties
                    }
                  >
                    {member.name}
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
