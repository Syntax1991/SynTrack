import type {
  BattleNetAccountProfile
} from "./battlenet.types.js";

export type ImportableBattleNetCharacter = {
  battleNetId: string;
  name: string;
  realm: string;
  realmSlug: string;
  className: string;
  level: number;
};

type BattleNetCharacterIdentity = {
  battleNetId: string;
  realmSlug: string;
};

export function createBattleNetCharacterKey(
  character: BattleNetCharacterIdentity
): string {
  return [
    character.battleNetId,
    character.realmSlug.toLowerCase()
  ].join(":");
}

export function normalizeBattleNetCharacters(
  profile: BattleNetAccountProfile
): ImportableBattleNetCharacter[] {
  const characterMap =
    new Map<
      string,
      ImportableBattleNetCharacter
    >();

  for (
    const account of
    profile.wow_accounts ?? []
  ) {
    for (
      const character of
      account.characters ?? []
    ) {
      if (
        typeof character.id !== "number" ||
        typeof character.name !== "string" ||
        typeof character.level !== "number" ||
        typeof character.realm?.name !== "string" ||
        typeof character.realm?.slug !== "string" ||
        typeof character.playable_class?.name !==
          "string"
      ) {
        continue;
      }

      const normalizedCharacter = {
        battleNetId: String(character.id),
        name: character.name,
        realm: character.realm.name,
        realmSlug: character.realm.slug,
        className:
          character.playable_class.name,
        level: character.level
      };

      characterMap.set(
        createBattleNetCharacterKey(
          normalizedCharacter
        ),
        normalizedCharacter
      );
    }
  }

  return [...characterMap.values()];
}