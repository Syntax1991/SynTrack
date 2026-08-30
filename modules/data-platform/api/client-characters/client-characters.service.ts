import type {
  ClientCharacterIdentityRow,
  ClientCharacterSummary
} from "./client-characters.types.js";

/*
 * SynTrack's Character model has no per-account owner relation anywhere
 * in the schema (see RaiderAccount/DeviceCredential - personal data
 * stays single-tenant, matching the rest of the app). So unlike
 * ClientProfileService (which resolves one specific RaiderAccount's
 * battleTag), this deliberately does not - and cannot honestly - filter
 * characters "by owner": there is exactly one character roster in this
 * deployment, and every valid device credential is allowed to read it.
 * The auth boundary that DOES apply is ordinary credential validity
 * (invalid/revoked -> unauthorized), enforced by the controller before
 * this service is ever reached.
 *
 * itemLevel and lastSyncedAt are resolved through the two injected
 * functions rather than computed here, reusing GearReadinessService's
 * existing averageItemLevel and DataHealthRepository's existing capture
 * timestamps instead of re-deriving either from scratch.
 */
export class ClientCharactersService {
  constructor(
    private readonly listCharacters: () => Promise<
      ClientCharacterIdentityRow[]
    >,
    private readonly findItemLevels: (
      characterIds: string[]
    ) => Promise<Map<string, number | null>>,
    private readonly findLastCapturedAt: (
      characterIds: string[]
    ) => Promise<Map<string, Date | null>>
  ) {}

  async list(): Promise<ClientCharacterSummary[]> {
    const characters = await this.listCharacters();
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
