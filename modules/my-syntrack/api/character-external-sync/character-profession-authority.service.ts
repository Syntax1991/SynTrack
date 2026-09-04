import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_PROFESSIONS,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type {
  AuthoritativeProfessionEntry,
  NormalizedBlizzardProfessionEntry,
  NormalizedBlizzardProfessionsPayload
} from "./character-external-sync.types.js";

/*
 * Professions skill progresses somewhat regularly during active play but
 * far less often than equipment (which can change every dungeon/raid) -
 * a middle-ground threshold between Equipment's 24h and Profile's 7 days.
 */
const BLIZZARD_PROFESSIONS_STALE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

export type AddonProfessionRow = {
  professionKey: string;
  professionName: string;
  skill: number;
};

/*
 * PUBLIC PROFESSION PROFILE (learned profession, tier, skill, max skill):
 * PRIMARY=BLIZZARD, FALLBACK=the existing CharacterProfession row (ADDON/
 * manual/BattleNet-import sourced skill - the only field of these four
 * that already existed before this phase).
 *
 * This service NEVER reads or writes Knowledge Points, specialization
 * node progress, weekly quest/Treatise/Treasure state, or crafting
 * simulation - those remain permanently ADDON-owned with no fallback,
 * and are simply not represented in this adapter's output at all. A
 * consumer that needs them keeps reading CharacterProfession/
 * CharacterProfessionNodeProgress/etc. directly, exactly as today.
 *
 * Absence handling (Phase C6): a profession the addon knows about but
 * the current Blizzard snapshot doesn't (a swap, or stale/incomplete
 * Blizzard data) is never dropped - it's still returned, source="ADDON",
 * with whatever the addon last captured. Nothing is ever deleted here.
 */
export class CharacterProfessionAuthorityService {
  constructor(
    private readonly snapshotRepository: CharacterExternalSnapshotRepository
  ) {}

  async getAuthoritativeProfessions(
    characterId: string,
    addonProfessions: AddonProfessionRow[]
  ): Promise<AuthoritativeProfessionEntry[]> {
    const snapshot =
      await this.snapshotRepository.findOne<NormalizedBlizzardProfessionsPayload>(
        characterId,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_PROFESSIONS
      );

    const hasSuccessfulSnapshot =
      snapshot !== null &&
      snapshot.payload !== null &&
      snapshot.fetchedAt !== null;

    const isStale =
      hasSuccessfulSnapshot &&
      Date.now() - snapshot!.fetchedAt!.getTime() >
        BLIZZARD_PROFESSIONS_STALE_THRESHOLD_MS;

    const blizzardByKey = new Map<string, NormalizedBlizzardProfessionEntry>();

    if (hasSuccessfulSnapshot) {
      for (const entry of snapshot!.payload!.professions) {
        if (entry.professionKey) {
          blizzardByKey.set(entry.professionKey, entry);
        }
      }
    }

    const results: AuthoritativeProfessionEntry[] = [];
    const seenKeys = new Set<string>();

    for (const addonRow of addonProfessions) {
      seenKeys.add(addonRow.professionKey);

      const blizzardEntry = blizzardByKey.get(addonRow.professionKey);

      if (!blizzardEntry) {
        results.push({
          source: "ADDON",
          professionKey: addonRow.professionKey,
          professionId: null,
          professionName: addonRow.professionName,
          tierId: null,
          tierName: null,
          skill: addonRow.skill,
          maxSkill: null,
          fetchedAt: null,
          isStale: false
        });
        continue;
      }

      results.push({
        source: "BLIZZARD",
        professionKey: addonRow.professionKey,
        professionId: blizzardEntry.professionId,
        /*
         * Prefer SynTrack's own catalog name (always English/canonical -
         * see Profession.name) over Blizzard's, which is localized to
         * BATTLENET_LOCALE ("Alchemie", not "Alchemy") and would read as
         * an inconsistent mix of languages next to the rest of the UI.
         */
        professionName: addonRow.professionName,
        tierId: blizzardEntry.tierId,
        tierName: blizzardEntry.tierName,
        // stale: a real fallback exists (the addon's own skill) - prefer
        // it, same rule as Profile's level/class staleness fallback.
        skill: isStale ? addonRow.skill : (blizzardEntry.skill ?? addonRow.skill),
        // no addon equivalent for max skill exists at all - keep serving
        // the stale value rather than nulling out real information.
        maxSkill: blizzardEntry.maxSkill,
        fetchedAt: snapshot!.fetchedAt,
        isStale
      });
    }

    // Professions Blizzard reports that SynTrack has no CharacterProfession
    // row for at all (a brand-new/never-addon-synced character) - only
    // surfaced when the snapshot is fresh, so a stale snapshot never
    // introduces a profession the addon hasn't confirmed recently.
    if (!isStale) {
      for (const [key, entry] of blizzardByKey) {
        if (seenKeys.has(key)) {
          continue;
        }

        results.push({
          source: "BLIZZARD",
          professionKey: entry.professionKey,
          professionId: entry.professionId,
          professionName: entry.professionName ?? key,
          tierId: entry.tierId,
          tierName: entry.tierName,
          skill: entry.skill ?? 0,
          maxSkill: entry.maxSkill,
          fetchedAt: snapshot!.fetchedAt,
          isStale: false
        });
      }
    }

    return results;
  }
}
