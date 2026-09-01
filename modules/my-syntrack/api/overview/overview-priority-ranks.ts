import type {
  AttentionItem,
  AttentionSeverity
} from "./overview.types.js";

export const severityRank: Record<
  AttentionSeverity,
  number
> = {
  blocking: 0,
  urgent: 1,
  "this-week": 2,
  optional: 3
};

export const domainRank: Record<
  AttentionItem["domain"],
  number
> = {
  weekly: 0,
  profession: 1,
  "profession-knowledge-treasure": 2,
  "profession-weekly": 3,
  gear: 4,
  resources: 5,
  vault: 6
};

export const domainLabel: Record<
  AttentionItem["domain"],
  string
> = {
  weekly: "WEEKLIES",
  vault: "VAULT",
  profession: "PROFESSION",
  "profession-weekly": "PROFESSION",
  "profession-knowledge-treasure": "TREASURES",
  gear: "GEAR",
  resources: "RESOURCES"
};

export function isQuickWinAction(label: string): boolean {
  const normalized = label.toLowerCase();

  return (
    /^(1 |one )/.test(normalized) ||
    normalized.includes("treatise") ||
    normalized.includes("for vault slot 1") ||
    normalized.includes("1 more") ||
    normalized.includes("1 world activity")
  );
}

export function scoreAttentionItem(
  item: AttentionItem,
  characterLevel: number
): number {
  const severityScore =
    (4 - severityRank[item.severity]) * 1000;
  const domainScore =
    (10 - domainRank[item.domain]) * 100;
  const levelScore = characterLevel;
  const quickWinBonus = isQuickWinAction(item.label)
    ? 200
    : 0;

  return (
    severityScore + domainScore + levelScore + quickWinBonus
  );
}
