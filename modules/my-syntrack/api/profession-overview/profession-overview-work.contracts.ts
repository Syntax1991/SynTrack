import type { ProfessionOverviewItem } from "../../../professions/api/details/profession-detail.types.js";

export type ProfessionOverviewCraftLookup = {
  getOverview(): Promise<{
    items: ProfessionOverviewItem[];
  }>;
};

export function resolveCraftingCoverage(
  items: ProfessionOverviewItem[]
): {
  covered: number;
  total: number;
} {
  const craftingItems = items.filter(
    (item) => item.category === "CRAFTING"
  );

  return {
    covered: craftingItems.filter(
      (item) =>
        item.characterCount > 0 &&
        item.captureStatus === "CAPTURED"
    ).length,
    total: craftingItems.length
  };
}
