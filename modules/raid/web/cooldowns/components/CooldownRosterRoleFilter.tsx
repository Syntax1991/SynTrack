import {
  EFFECTIVE_ROLE_LABELS,
  type EffectiveRole
} from "../../../shared/catalog/raidSpecializationCatalog";

type RoleFilterValue = "ALL" | EffectiveRole;

type CooldownRosterRoleFilterProps = {
  active: RoleFilterValue;
  onChange: (value: RoleFilterValue) => void;
};

const displayedRoles: EffectiveRole[] = [
  "TANK",
  "HEALER",
  "DPS"
];

/**
 * Display-only — never mutates RaidBossRosterEntry, RaidSetupMember,
 * or any Cooldown Plan state. "All" always includes UNKNOWN-spec
 * members; there's no separate Unknown tab, since filtering roster
 * visibility on missing data isn't the point of this control.
 */
export function CooldownRosterRoleFilter({
  active,
  onChange
}: CooldownRosterRoleFilterProps) {
  return (
    <div className="cooldown-roster-role-filter">
      <button
        className={
          active === "ALL"
            ? "cooldown-roster-role-button is-active"
            : "cooldown-roster-role-button"
        }
        onClick={() => onChange("ALL")}
        type="button"
      >
        All
      </button>

      {displayedRoles.map((role) => (
        <button
          className={
            active === role
              ? "cooldown-roster-role-button is-active"
              : "cooldown-roster-role-button"
          }
          key={role}
          onClick={() => onChange(role)}
          type="button"
        >
          {EFFECTIVE_ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}
