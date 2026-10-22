import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type {
  JournalClient,
  JournalEncounterSummary,
  JournalInstanceSummary,
  JournalLootItem
} from "../../../data-platform/api/integrations/battlenet/battlenet-journal.service.js";

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

type CacheEntry<T> = { value: T; expiresAt: number };

/*
 * Current-season instance -> boss -> loot catalog for the Bonus Roll
 * planner, served from the Blizzard Encounter Journal and cached in
 * memory (static game data). Failed lookups are never cached, so a
 * Blizzard hiccup heals on the next request.
 *
 * Also the server-side validator for writes: a roll may only reference
 * a current-season instance, a boss of that instance, and items from
 * that boss's loot table - names are taken from here, never from the
 * client.
 */
export class BonusRollCatalogService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly journal: JournalClient,
    private readonly ttlMs = DEFAULT_TTL_MS,
    private readonly now: () => number = Date.now
  ) {}

  async listInstances(): Promise<JournalInstanceSummary[]> {
    const instances = await this.cached("instances", () =>
      this.journal.listCurrentSeasonInstances().then((list) => (list.length > 0 ? list : null))
    );

    if (!instances) {
      throw new AppError(502, "The current season instances could not be loaded from Blizzard.");
    }

    return instances;
  }

  async listEncounters(instanceId: number): Promise<JournalEncounterSummary[]> {
    await this.requireInstance(instanceId);

    const encounters = await this.cached(`encounters:${instanceId}`, () =>
      this.journal.listInstanceEncounters(instanceId)
    );

    if (!encounters) {
      throw new AppError(502, "The bosses of this instance could not be loaded from Blizzard.");
    }

    return encounters;
  }

  async listLoot(instanceId: number, encounterId: number): Promise<JournalLootItem[]> {
    await this.requireEncounter(instanceId, encounterId);

    const loot = await this.cached(`loot:${encounterId}`, () =>
      this.journal.listEncounterLoot(encounterId)
    );

    if (!loot) {
      throw new AppError(502, "The loot of this boss could not be loaded from Blizzard.");
    }

    return loot;
  }

  async requireInstance(instanceId: number): Promise<JournalInstanceSummary> {
    const instance = (await this.listInstances()).find((entry) => entry.id === instanceId);

    if (!instance) {
      throw new AppError(400, "This instance is not part of the current season.");
    }

    return instance;
  }

  async requireEncounter(
    instanceId: number,
    encounterId: number
  ): Promise<{ instance: JournalInstanceSummary; encounter: JournalEncounterSummary }> {
    const instance = await this.requireInstance(instanceId);
    const encounter = (await this.listEncounters(instanceId)).find((entry) => entry.id === encounterId);

    if (!encounter) {
      throw new AppError(400, "This boss is not part of the selected instance.");
    }

    return { instance, encounter };
  }

  async requireLootItem(
    instanceId: number,
    encounterId: number,
    itemId: number
  ): Promise<JournalLootItem> {
    const item = (await this.listLoot(instanceId, encounterId)).find((entry) => entry.id === itemId);

    if (!item) {
      throw new AppError(400, "This item does not drop from this boss.");
    }

    return item;
  }

  private async cached<T>(key: string, load: () => Promise<T | null>): Promise<T | null> {
    const hit = this.cache.get(key) as CacheEntry<T> | undefined;

    if (hit && hit.expiresAt > this.now()) {
      return hit.value;
    }

    const value = await load();

    if (value !== null) {
      this.cache.set(key, { value, expiresAt: this.now() + this.ttlMs });
    }

    return value;
  }
}
