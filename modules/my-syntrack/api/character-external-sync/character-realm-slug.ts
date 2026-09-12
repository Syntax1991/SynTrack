/**
 * Several stored sources (manual entry, the addon's GetRealmName())
 * only ever capture a realm display name, never the Blizzard realm
 * slug Battle.net API paths require. Blizzard slugs are almost always
 * just the lowercased, hyphenated display name, so this heuristic
 * covers the common case. Realms with unusual characters may not
 * resolve; callers should skip those rather than failing the whole
 * operation.
 */
export function slugifyRealmName(
  realm: string
): string {
  return realm
    .toLowerCase()
    .trim()
    .replace(/'/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}
