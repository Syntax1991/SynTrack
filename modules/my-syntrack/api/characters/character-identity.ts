export type CharacterIdentityInput = {
  name: string;
  realm: string;
  region: string;
  battleNetId?: string | null;
};

function normalizePart(value: string): string {
  return value.trim().toLowerCase();
}

/** Realm+name key used by addon/manual identity (never name alone). */
export function buildNameRealmCharacterKey(
  input: Pick<CharacterIdentityInput, "name" | "realm" | "region">
): string {
  return [
    "nr",
    normalizePart(input.region),
    normalizePart(input.realm),
    normalizePart(input.name)
  ].join(":");
}

/** Blizzard character id key when a trustworthy battleNetId is present. */
export function buildBattleNetCharacterKey(
  region: string,
  battleNetId: string
): string {
  return ["bn", normalizePart(region), battleNetId.trim()].join(":");
}

/**
 * Canonical suppression key for persistence.
 * Prefer battleNetId when present; otherwise name+realm+region.
 */
export function buildStableCharacterKey(
  input: CharacterIdentityInput
): string {
  const battleNetId = input.battleNetId?.trim();

  if (battleNetId) {
    return buildBattleNetCharacterKey(input.region, battleNetId);
  }

  return buildNameRealmCharacterKey(input);
}

export function buildSuppressionLookupKeys(
  input: CharacterIdentityInput
): string[] {
  const keys = [buildNameRealmCharacterKey(input)];
  const battleNetId = input.battleNetId?.trim();

  if (battleNetId) {
    keys.push(buildBattleNetCharacterKey(input.region, battleNetId));
  }

  return [...new Set(keys)];
}
