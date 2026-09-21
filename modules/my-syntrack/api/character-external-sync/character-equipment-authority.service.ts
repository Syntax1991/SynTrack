import { CharacterEquipmentAddonFallbackRepository } from "./character-equipment-addon-fallback.repository.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_EQUIPMENT,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type {
  AuthoritativeEquipmentResult,
  NormalizedBlizzardEquipmentPayload
} from "./character-external-sync.types.js";

/*
 * How long a successful Blizzard snapshot is trusted before ADDON gets
 * a chance to take over (rule 4 of the Phase A source-precedence spec).
 * A plain constant, not a config table - proportional to this app's
 * current scale; revisit if/when a real TTL policy is needed per domain.
 */
const BLIZZARD_EQUIPMENT_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/*
 * Provider authority beats cross-provider freshness: BLIZZARD is
 * PRIMARY, ADDON is FALLBACK. A newer ADDON capture never overwrites a
 * valid BLIZZARD value merely because its timestamp is newer -
 * freshness only ever decides between snapshots from the SAME source
 * (handled here by fetchedAt vs the staleness threshold, never by
 * comparing across sources). BLIZZARD automatically regains authority
 * the moment a fresh snapshot exists again - there is no one-way
 * handoff to track.
 *
 * The one exception is per-field, not cross-provider-freshness-based:
 * toBlizzardResult() below nulls a scaled-bracket item's level (real
 * evidence - Blizzard's own `timewalker_level` field - not a timestamp
 * comparison), so the composition layer falls back to the addon's value
 * for that one field. See the Phase F1 corrective review report for why
 * a `last_login_timestamp`-based cross-provider guard was tried and then
 * removed from this domain.
 */
export class CharacterEquipmentAuthorityService {
  constructor(
    private readonly snapshotRepository: CharacterExternalSnapshotRepository,
    private readonly addonFallbackRepository: CharacterEquipmentAddonFallbackRepository
  ) {}

  async getAuthoritativeEquipment(
    characterId: string
  ): Promise<AuthoritativeEquipmentResult> {
    const snapshot =
      await this.snapshotRepository.findOne<NormalizedBlizzardEquipmentPayload>(
        characterId,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_EQUIPMENT
      );

    const hasSuccessfulBlizzardSnapshot =
      snapshot !== null &&
      snapshot.payload !== null &&
      snapshot.fetchedAt !== null;

    if (hasSuccessfulBlizzardSnapshot) {
      const isStale =
        Date.now() - snapshot.fetchedAt!.getTime() >
        BLIZZARD_EQUIPMENT_STALE_THRESHOLD_MS;

      if (!isStale) {
        return this.toBlizzardResult(snapshot.payload!, snapshot.fetchedAt!, false);
      }
    }

    const addonSlots = await this.addonFallbackRepository.findSlots(
      characterId
    );

    if (addonSlots.length > 0) {
      return {
        source: "ADDON",
        averageItemLevel: averageOf(
          addonSlots
            .map((slot) => slot.itemLevel)
            .filter((level): level is number => level !== null)
        ),
        slots: addonSlots,
        fetchedAt: null,
        isStale: false
      };
    }

    // No ADDON data either - a stale Blizzard snapshot still beats
    // nothing, but callers can see isStale and decide what to do.
    if (hasSuccessfulBlizzardSnapshot) {
      return this.toBlizzardResult(
        snapshot!.payload!,
        snapshot!.fetchedAt!,
        true
      );
    }

    return {
      source: "NONE",
      averageItemLevel: null,
      slots: [],
      fetchedAt: null,
      isStale: false
    };
  }

  private toBlizzardResult(
    payload: NormalizedBlizzardEquipmentPayload,
    fetchedAt: Date,
    isStale: boolean
  ): AuthoritativeEquipmentResult {
    return {
      source: "BLIZZARD",
      averageItemLevel: payload.averageItemLevel,
      slots: payload.slots.map((slot) => ({
        slotKey: slot.slotKey,
        itemId: slot.itemId,
        itemName: slot.itemName,
        /*
         * A scaled-bracket item (Timewalking, etc.) never reports its
         * real item level here - null means "no trustworthy Blizzard
         * item level for this slot", so the effective-equipment
         * composition layer (gear-readiness.effective.ts) falls back to
         * the addon's own item level for this specific slot, the same
         * way it already does when Blizzard has no slot coverage at
         * all. See the Phase F1 corrective review's Synbeast finding
         * (an entire equipped set scaled to a Timewalking dungeon:
         * addon ilvl 473, Blizzard's scaled ilvl 76, same item id).
         */
        itemLevel:
          typeof slot.timewalkerLevel === "number" ? null : slot.itemLevel,
        hasEnchant: slot.hasEnchant,
        socketCount: slot.socketCount,
        filledSocketCount: slot.filledSocketCount,
        // Phase F2: proven equivalent to the addon's setId - see gear-readiness.effective.ts.
        setId: slot.setId
      })),
      fetchedAt,
      isStale
    };
  }
}

function averageOf(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
