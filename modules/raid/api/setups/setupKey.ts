import { randomBytes } from "node:crypto";

/**
 * The persisted Setup identity is `id` (a real cuid), never `key` —
 * `key` only exists to satisfy the real `@@unique([raidEventId, key])`
 * constraint that makes "main" idempotent. A manually created Setup
 * still needs *some* stable key, so this derives a readable slug from
 * the officer's chosen name plus a random suffix — never a bare slug
 * alone, which would collide the moment two Setups shared a name
 * (e.g. two "Split 1"s created independently) and would need a
 * database round-trip to detect. The random suffix makes collision
 * astronomically unlikely without that round-trip, while the slug
 * prefix keeps the key human-debuggable.
 */
export function generateSetupKey(
  name: string
): string {
  const slug = slugifySetupName(name);
  const suffix = randomBytes(4).toString(
    "hex"
  );

  return `${slug}-${suffix}`;
}

function slugifySetupName(
  name: string
): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "setup";
}
