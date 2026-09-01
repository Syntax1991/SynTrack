import type {
  AttentionItem,
  AttentionSeverity,
  CharacterWeeklyState
} from "./overview.types.js";
import {
  domainRank,
  severityRank
} from "./overview-priority-ranks.js";

function bestSeverityRank(
  items: AttentionItem[]
) {
  return items.reduce(
    (best, item) =>
      Math.min(
        best,
        severityRank[item.severity]
      ),
    Number.POSITIVE_INFINITY
  );
}

export function pickNextAction(
  items: AttentionItem[]
): CharacterWeeklyState["nextAction"] {
  if (items.length === 0) {
    return null;
  }

  const sorted = [...items].sort(
    (left, right) =>
      severityRank[left.severity] -
        severityRank[
          right.severity
        ] ||
      domainRank[left.domain] -
        domainRank[right.domain]
  );

  const best = sorted[0];

  if (!best) {
    return null;
  }

  return {
    domain: best.domain,
    label: best.label,
    detail: best.detail,
    path: best.path,
    severity: best.severity
  };
}

/*
 * Ordering: characters needing action first (most severe first), then
 * partially-tracked/unknown characters, then fully-ready characters last
 * - matching the product rule that ready alts should not consume the top
 * of the screen. Ties broken by level desc then name asc, matching the
 * ordering convention already used by the Weekly/Vault/Gear domain
 * services themselves.
 */
export function sortCharacterWeeklyStates(
  characters: CharacterWeeklyState[]
): CharacterWeeklyState[] {
  function groupOf(
    state: CharacterWeeklyState
  ) {
    if (
      state.readinessState ===
      "attention"
    ) {
      return 0;
    }

    if (
      state.readinessState ===
      "unknown"
    ) {
      return 1;
    }

    return 2;
  }

  return [...characters].sort(
    (left, right) => {
      const groupDifference =
        groupOf(left) -
        groupOf(right);

      if (groupDifference !== 0) {
        return groupDifference;
      }

      const severityDifference =
        bestSeverityRank(
          left.attentionItems
        ) -
        bestSeverityRank(
          right.attentionItems
        );

      if (
        severityDifference !== 0
      ) {
        return severityDifference;
      }

      if (
        left.character.level !==
        right.character.level
      ) {
        return (
          right.character.level -
          left.character.level
        );
      }

      return left.character.name.localeCompare(
        right.character.name,
        "en"
      );
    }
  );
}
