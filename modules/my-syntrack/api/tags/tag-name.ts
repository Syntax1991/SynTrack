/*
 * One deterministic normalization applied once, at the write boundary.
 * Storage keeps the user's chosen casing (trim only); duplicate
 * detection compares case-insensitively so "Raid" / "raid" / " Raid "
 * are treated as the same tag, never three cosmetic near-duplicates.
 */
export function normalizeTagName(
  name: string
): string {
  return name.trim();
}

export function normalizeTagNameForComparison(
  name: string
): string {
  return name.trim().toLowerCase();
}
