/*
 * One captured currency-list row. A currency the character has never
 * discovered simply never appears here at all (see the Resources module
 * capture loop) - there is no "undiscovered" entry with fabricated
 * zeros. Every cap/weekly field is nullable because the underlying WoW
 * API can legitimately provide no evidence for it (no weekly limit, a
 * failed dedicated cap check) - never defaulted to 0/false.
 */
export type AddonCurrencyEntry = {
  currencyId: number;
  quantity: number | null;
  maxQuantity: number | null;
  weeklyQuantity: number | null;
  maxWeeklyQuantity: number | null;
  isCapped: boolean | null;
  isWeeklyCapped: boolean | null;
  discovered: boolean | null;
  accountWide: boolean | null;
};

/*
 * One configured item-backed resource (e.g. Spark of Tides) - the addon
 * ships its own small internal `key` for readability, but the backend
 * must always match on itemId (the factual WoW identity), never on this
 * key (see addon-import.resource.normalizer.ts).
 */
export type AddonItemResourceEntry = {
  key: string;
  itemId: number;
  count: number | null;
};

export type AddonResourceSnapshot = {
  schemaVersion: number;
  capturedAt: string | null;
  currencies: AddonCurrencyEntry[];
  items: AddonItemResourceEntry[];
};
