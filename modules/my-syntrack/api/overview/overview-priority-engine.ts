import type {
  AttentionItem,
  CharacterWeeklyState
} from "./overview.types.js";
import type {
  OverviewPriorities,
  PriorityAction,
  PriorityBucket,
  PriorityEffort
} from "./overview-priority.types.js";
import {
  domainLabel,
  isQuickWinAction,
  scoreAttentionItem
} from "./overview-priority-ranks.js";

export type {
  OverviewPriorities,
  PriorityAction,
  PriorityBucket,
  PriorityEffort
} from "./overview-priority.types.js";

function effortForItem(item: AttentionItem): PriorityEffort {
  if (isQuickWinAction(item.label)) {
    return "low";
  }

  if (
    item.severity === "blocking" ||
    item.severity === "urgent"
  ) {
    return "high";
  }

  return "medium";
}

function bucketForItem(item: AttentionItem): PriorityBucket {
  if (
    item.severity === "blocking" ||
    item.severity === "urgent"
  ) {
    return "needs-attention";
  }

  if (isQuickWinAction(item.label)) {
    return "quick-wins";
  }

  return "this-week";
}

function toPriorityAction(
  item: AttentionItem,
  characterLevel: number
): PriorityAction {
  return {
    id: item.id,
    characterId: item.characterId,
    characterName: item.characterName,
    domain: item.domain,
    domainLabel: domainLabel[item.domain],
    severity: item.severity,
    label: item.label,
    detail: item.detail,
    path: item.path,
    score: scoreAttentionItem(item, characterLevel),
    bucket: bucketForItem(item),
    effort: effortForItem(item)
  };
}

function characterLevelById(
  characters: CharacterWeeklyState[]
) {
  return new Map(
    characters.map((character) => [
      character.character.id,
      character.character.level
    ])
  );
}

/*
 * Account-level priority engine: ranks canonical AttentionItems across
 * characters without inventing new completion state. Per-character
 * nextAction remains the matrix column; topActions is the cross-account
 * "what should I do next?" feed.
 */
export function computeAccountPriorities(input: {
  characters: CharacterWeeklyState[];
  attentionItems: AttentionItem[];
  topActionLimit?: number;
}): OverviewPriorities {
  const levels = characterLevelById(input.characters);
  const topActionLimit = input.topActionLimit ?? 4;

  const rankedItems = input.attentionItems
    .map((item) =>
      toPriorityAction(
        item,
        levels.get(item.characterId) ?? 0
      )
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.characterName.localeCompare(
          right.characterName,
          "en"
        )
    );

  const topActions = input.characters
    .filter((character) => character.nextAction)
    .map((character) => {
      const next = character.nextAction!;
      const matchingItem =
        character.attentionItems.find(
          (item) => item.label === next.label
        ) ?? {
          id: `${character.character.id}:next-action`,
          characterId: character.character.id,
          characterName: character.character.name,
          domain: next.domain,
          severity: next.severity,
          label: next.label,
          detail: next.detail,
          path: next.path
        };

      return toPriorityAction(
        matchingItem,
        character.character.level
      );
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.characterName.localeCompare(
          right.characterName,
          "en"
        )
    )
    .slice(0, topActionLimit);

  return {
    topActions,
    buckets: {
      needsAttention: rankedItems.filter(
        (item) => item.bucket === "needs-attention"
      ),
      quickWins: rankedItems.filter(
        (item) => item.bucket === "quick-wins"
      ),
      thisWeek: rankedItems.filter(
        (item) => item.bucket === "this-week"
      )
    },
    readyCharacterCount: input.characters.filter(
      (character) =>
        character.readinessState === "ready"
    ).length
  };
}
