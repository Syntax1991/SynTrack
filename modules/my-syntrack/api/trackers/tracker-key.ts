/*
 * One deterministic normalization applied once, at the write boundary -
 * never re-derived in different layers (repository/read paths always
 * trust whatever was already stored).
 */
export function normalizeTrackerKey(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeTrackerScopeKey(
  value: string
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
