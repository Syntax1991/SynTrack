import { computeRoleCounts } from "../../../shared/catalog/raidSpecializationCatalog";
import type { RaidBoss } from "../types/bossRoster.types";

type BossMatrixFooterProps = {
  bosses: RaidBoss[];
  poolMemberIds: Set<string>;
};

/**
 * Real Tank/Healer/DPS/Unknown composition per boss column — the
 * matrix itself stays a member x boss grid (regrouping rows by a
 * per-boss-column spec isn't representable in a single shared row
 * order), so this compact summary row is what makes "who's a Tank
 * for THIS boss" readable at a glance without restructuring the
 * table. Counts only CONFIRMED pool members, matching the existing
 * Confirmed row above it.
 */
export function BossMatrixFooter({
  bosses,
  poolMemberIds
}: BossMatrixFooterProps) {
  return (
    <tfoot>
      <tr>
        <td className="boss-matrix-role-header">
          Confirmed
        </td>

        {bosses.map((boss) => {
          const confirmedCount =
            boss.rosterEntries.filter(
              (entry) =>
                entry.status ===
                  "CONFIRMED" &&
                poolMemberIds.has(
                  entry.memberId
                )
            ).length;

          return (
            <td
              key={boss.id}
              className="boss-matrix-role-header"
            >
              {confirmedCount}
            </td>
          );
        })}
      </tr>

      <tr>
        <td
          className="boss-matrix-role-header"
          title="Tanks / Healers / DPS / Unknown"
        >
          Composition
        </td>

        {bosses.map((boss) => {
          const specIds =
            boss.rosterEntries
              .filter(
                (entry) =>
                  entry.status ===
                    "CONFIRMED" &&
                  poolMemberIds.has(
                    entry.memberId
                  )
              )
              .map(
                (entry) =>
                  entry.specId
              );

          const counts =
            computeRoleCounts(specIds);

          return (
            <td
              className="boss-matrix-role-header boss-matrix-composition-cell"
              key={boss.id}
              title="Tanks / Healers / DPS / Unknown specialization, for this boss's confirmed lineup"
            >
              {counts.TANK}/{counts.HEALER}/
              {counts.DPS}/{counts.UNKNOWN}
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}
