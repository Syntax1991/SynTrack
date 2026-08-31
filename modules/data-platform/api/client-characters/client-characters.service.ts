import type {
  ClientCharacterIdentityRow,
  ClientCharacterSummary
} from "./client-characters.types.js";

/*
 * Roster is strictly account-scoped: only characters whose
 * Character.raiderAccountId matches the DeviceCredential's owner.
 * Legacy (unowned) credentials never receive a roster - they must
 * reconnect first. Cross-account leakage is prevented by the owner
 * filter, not by "single tenant" assumptions.
 */
export class ClientCharactersService {
  constructor(
    private readonly listCharactersForAccount: (
      raiderAccountId: string
    ) => Promise<ClientCharacterIdentityRow[]>,
    private readonly findItemLevels: (
      characterIds: string[]
    ) => Promise<Map<string, number | null>>,
    private readonly findLastCapturedAt: (
      characterIds: string[]
    ) => Promise<Map<string, Date | null>>
  ) {}

  async listForAccount(
    raiderAccountId: string
  ): Promise<ClientCharacterSummary[]> {
    const characters =
      await this.listCharactersForAccount(
        raiderAccountId
      );
    const characterIds = characters.map(
      (character) => character.id
    );

    const [itemLevels, lastCapturedAt] =
      await Promise.all([
        this.findItemLevels(characterIds),
        this.findLastCapturedAt(characterIds)
      ]);

    return characters.map((character) => ({
      id: character.id,
      name: character.name,
      realm: character.realm,
      className: character.className,
      level: character.level,
      itemLevel:
        itemLevels.get(character.id) ??
        null,
      lastSyncedAt:
        lastCapturedAt
          .get(character.id)
          ?.toISOString() ?? null
    }));
  }
}
