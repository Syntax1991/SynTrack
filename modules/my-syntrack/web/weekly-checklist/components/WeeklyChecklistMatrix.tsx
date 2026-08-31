import { Link } from "react-router-dom";
import { isWeeklyGameplayEnabled } from "../../../api/character-tracking/domain-applicability.js";
import { formatKnownWeeklyProgressSymbol } from "../../../api/weekly-progress/weekly-progress-display.js";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type {
  ProfessionWeeklyAggregate,
  WeeklyChecklistCharacter
} from "../types/weeklyChecklist.types";
import { gameplayDomainToken } from "./weeklyChecklistTokens";

function aggregateToken(
  aggregate: ProfessionWeeklyAggregate,
  label: string
) {
  if (aggregate.applicableTotal === 0) {
    return {
      symbol: "—",
      tone: "not-tracked" as const,
      title: `${label} - not tracked`
    };
  }

  if (aggregate.incompleteCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "attention" as const,
      title: `${label} - ${aggregate.incompleteCount} incomplete`
    };
  }

  if (aggregate.unknownCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "unknown" as const,
      title: `${label} - ${aggregate.unknownCount} unknown`
    };
  }

  return {
    symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
    tone: "ready" as const,
    title: `${label} - complete`
  };
}

function progressToken(character: WeeklyChecklistCharacter) {
  const aggregates = [
    character.professionWeekly.quest,
    character.professionWeekly.treatise,
    character.professionWeekly.drops
  ];

  let completedKnown = 0;
  let applicableKnown = 0;
  let unknownCount = 0;
  let incomplete = 0;

  for (const aggregate of aggregates) {
    if (aggregate.applicableTotal === 0) {
      continue;
    }

    if (
      aggregate.incompleteCount === 0 &&
      aggregate.unknownCount === aggregate.applicableTotal
    ) {
      unknownCount += 1;
      continue;
    }

    if (aggregate.unknownCount > 0 && aggregate.incompleteCount === 0) {
      unknownCount += 1;
      applicableKnown += aggregate.completeCount;
      completedKnown += aggregate.completeCount;
      continue;
    }

    applicableKnown += aggregate.applicableTotal;
    completedKnown += aggregate.completeCount;
    incomplete += aggregate.incompleteCount;
  }

  if (isWeeklyGameplayEnabled(character.trackingProfile)) {
    const gameplay = character.weeklyGameplay;

    if (!gameplay) {
      unknownCount += 4;
    } else {
      for (const domain of [
        gameplay.vault,
        gameplay.mythicPlus,
        gameplay.raid,
        gameplay.delves
      ]) {
        if (domain.state === "UNKNOWN") {
          unknownCount += 1;
        }
      }
    }
  }

  if (applicableKnown === 0 && incomplete === 0) {
    return {
      symbol: unknownCount > 0 ? `0 · ${unknownCount}?` : "—",
      tone: "unknown" as const,
      title: "Weekly progress unresolved"
    };
  }

  const symbol = formatKnownWeeklyProgressSymbol({
    completedKnown,
    applicableKnown,
    unknownCount
  });

  return {
    symbol,
    tone:
      incomplete > 0
        ? ("attention" as const)
        : unknownCount > 0
          ? ("unknown" as const)
          : ("ready" as const),
    title: `Known automatic weekly progress ${completedKnown}/${applicableKnown}`
  };
}

function weeklyActionLabel(character: WeeklyChecklistCharacter): string | null {
  for (const profession of character.professionWeekly.professions) {
    if (profession.treatise?.state === "INCOMPLETE") {
      return `${profession.name} Treatise missing`;
    }

    if (profession.quest?.state === "INCOMPLETE") {
      return `${profession.name} Quest remaining`;
    }

    if (profession.drops?.state === "INCOMPLETE") {
      const remaining =
        (profession.drops.maxValue ?? 0) -
        (profession.drops.currentValue ?? 0);
      return remaining > 0
        ? `${remaining} Knowledge Drop${remaining === 1 ? "" : "s"} remaining`
        : "Knowledge Drops remaining";
    }
  }

  if (!isWeeklyGameplayEnabled(character.trackingProfile)) {
    return null;
  }

  return (
    character.weeklyGameplay?.mythicPlusAction ??
    character.weeklyGameplay?.raidAction ??
    character.weeklyGameplay?.delvesAction ??
    null
  );
}

type WeeklyChecklistMatrixProps = {
  characters: WeeklyChecklistCharacter[];
};

/*
 * Weeklies = recurring detail only. Manual built-in toggles, Gear, and
 * old Prof KP are removed. Vault/M+/Raid/Delves stay ? until automated.
 * ACTION is weekly-only (never Gear / permanent Treasures).
 */
export function WeeklyChecklistMatrix({
  characters
}: WeeklyChecklistMatrixProps) {
  if (characters.length === 0) {
    return (
      <div className="empty-state">
        No characters match this filter.
      </div>
    );
  }

  return (
    <div className="table-scroll matrix-scroll">
      <table className="dense-matrix">
        <thead>
          <tr>
            <th>Character</th>
            <th className="matrix-col-narrow">Vault</th>
            <th className="matrix-col-narrow">M+</th>
            <th className="matrix-col-narrow">Raid</th>
            <th className="matrix-col-narrow">Delves</th>
            <th className="matrix-col-narrow">Quest</th>
            <th className="matrix-col-narrow">Treat.</th>
            <th className="matrix-col-narrow">Drops</th>
            <th className="matrix-col-narrow">Progress</th>
            <th className="matrix-col-action">Action</th>
          </tr>
        </thead>

        <tbody>
          {characters.map((character) => {
            const action = weeklyActionLabel(character);

            return (
              <tr key={character.id}>
                <td>
                  <div className="matrix-identity">
                    <Link
                      className="matrix-character-link"
                      style={{
                        color: getClassColor(character.className)
                      }}
                      to={`/characters/${character.id}`}
                    >
                      {character.name}
                    </Link>

                    <span>
                      {character.className}
                      {" · "}
                      {character.realm}
                    </span>
                  </div>
                </td>

                <td className="matrix-col-narrow">
                  <StatusToken
                    token={gameplayDomainToken(character, "vault")}
                  />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken
                    token={gameplayDomainToken(character, "mythicPlus")}
                  />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken
                    token={gameplayDomainToken(character, "raid")}
                  />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken
                    token={gameplayDomainToken(character, "delves")}
                  />
                </td>

                <td className="matrix-col-narrow">
                  <StatusToken
                    token={aggregateToken(
                      character.professionWeekly.quest,
                      "Weekly Quest"
                    )}
                  />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken
                    token={aggregateToken(
                      character.professionWeekly.treatise,
                      "Treatise"
                    )}
                  />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken
                    token={aggregateToken(
                      character.professionWeekly.drops,
                      "Knowledge Drops"
                    )}
                  />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken token={progressToken(character)} />
                </td>
                <td className="matrix-col-action">
                  {action ? (
                    <Link
                      className="overview-next-action"
                      to={`/characters/${character.id}`}
                    >
                      {action}
                    </Link>
                  ) : (
                    <span className="overview-next-action ready">✓</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
