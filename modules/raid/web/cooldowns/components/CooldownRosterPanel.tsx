import {
  useState,
  type CSSProperties
} from "react";
import { Link } from "react-router-dom";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import type { RaidSetupMember } from "../../raid-setup/types/raidSetup.types";
import {
  getSpecById,
  resolveEffectiveRole,
  type EffectiveRole
} from "../../../shared/catalog/raidSpecializationCatalog";
import { CooldownRosterEntryRow } from "./CooldownRosterEntryRow";
import { CooldownRosterRoleFilter } from "./CooldownRosterRoleFilter";
import { CooldownRosterSpellPanel } from "./CooldownRosterSpellPanel";

type CooldownRosterPanelProps = {
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  specIdByMemberId: Map<string, number | null>;
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
  specIdByMemberId,
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

  const [roleFilter, setRoleFilter] =
    useState<"ALL" | EffectiveRole>("ALL");

  const lineupMembers = rosterMembers
    .filter((member) =>
      lineupMemberIds.has(member.id)
    )
    .filter(
      (member) =>
        roleFilter === "ALL" ||
        resolveEffectiveRole(
          specIdByMemberId.get(
            member.id
          ) ?? null
        ) === roleFilter
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

      <CooldownRosterRoleFilter
        active={roleFilter}
        onChange={setRoleFilter}
      />

      <div className="cooldown-roster-panel-list">
        {lineupMembers.map((member) => (
          <CooldownRosterEntryRow
            hasAssignments={assignedMemberIds.has(
              member.id
            )}
            isHidden={hiddenMemberIds.has(
              member.id
            )}
            isPlanMember={planMemberIds.has(
              member.id
            )}
            isSelected={
              selectedMemberId === member.id
            }
            key={member.id}
            member={member}
            onAddPlanMember={
              onAddPlanMember
            }
            onRemovePlanMember={
              onRemovePlanMember
            }
            onSelectToggle={
              handleSelectToggle
            }
            onToggleHidden={
              onToggleHidden
            }
            spec={getSpecById(
              specIdByMemberId.get(
                member.id
              ) ?? null
            )}
          />
        ))}
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
