import { env } from "../../../../../apps/api/src/config/env.js";
import type { BattleNetAppTokenService } from "./battlenet-app-token.service.js";

/*
 * Encounter Journal (Game Data API, static namespace). Journal expansion
 * tier 505 is Blizzard's own "Current Season" tier: the dungeons and
 * raids of the running season, so callers never hardcode a season's
 * instance list. Verified live 2026-10-22 (Midnight Season 2: tier 505
 * lists the M+ pool and "Der Giftige Abgrund" ending in Ula'tek).
 */
export const CURRENT_SEASON_JOURNAL_TIER_ID = 505;

export type JournalInstanceKind = "DUNGEON" | "RAID";

export type JournalInstanceSummary = {
  id: number;
  name: string;
  kind: JournalInstanceKind;
};

export type JournalEncounterSummary = {
  id: number;
  name: string;
};

export type JournalLootItem = {
  id: number;
  name: string;
  slot: string | null;
  quality: string | null;
};

export interface JournalClient {
  listCurrentSeasonInstances(): Promise<JournalInstanceSummary[]>;
  listInstanceEncounters(instanceId: number): Promise<JournalEncounterSummary[] | null>;
  listEncounterLoot(encounterId: number): Promise<JournalLootItem[] | null>;
}

type NamedRef = { id?: number; name?: string };

export class BattleNetJournalService implements JournalClient {
  constructor(
    private readonly appTokenService: BattleNetAppTokenService
  ) {}

  async listCurrentSeasonInstances(): Promise<JournalInstanceSummary[]> {
    const payload = await this.get<{ dungeons?: NamedRef[]; raids?: NamedRef[] }>(
      `/data/wow/journal-expansion/${CURRENT_SEASON_JOURNAL_TIER_ID}`
    );

    if (!payload) {
      return [];
    }

    return [
      ...toSummaries(payload.raids, "RAID"),
      ...toSummaries(payload.dungeons, "DUNGEON")
    ];
  }

  async listInstanceEncounters(instanceId: number): Promise<JournalEncounterSummary[] | null> {
    const payload = await this.get<{ encounters?: NamedRef[] }>(
      `/data/wow/journal-instance/${instanceId}`
    );

    if (!payload) {
      return null;
    }

    return (payload.encounters ?? []).flatMap((encounter) =>
      typeof encounter.id === "number" && encounter.name
        ? [{ id: encounter.id, name: encounter.name }]
        : []
    );
  }

  async listEncounterLoot(encounterId: number): Promise<JournalLootItem[] | null> {
    const payload = await this.get<{ items?: { item?: NamedRef }[] }>(
      `/data/wow/journal-encounter/${encounterId}`
    );

    if (!payload) {
      return null;
    }

    const refs = (payload.items ?? []).flatMap((entry) =>
      typeof entry.item?.id === "number" && entry.item.name
        ? [{ id: entry.item.id, name: entry.item.name }]
        : []
    );

    // Slot / quality are display-only; an item lookup failure keeps the
    // item selectable with null details instead of dropping it.
    return Promise.all(
      refs.map(async (ref) => {
        const item = await this.get<{
          inventory_type?: { name?: string };
          quality?: { type?: string };
        }>(`/data/wow/item/${ref.id}`);

        return {
          id: ref.id,
          name: ref.name,
          slot: item?.inventory_type?.name ?? null,
          quality: item?.quality?.type ?? null
        };
      })
    );
  }

  private async get<T>(path: string): Promise<T | null> {
    try {
      const accessToken = await this.appTokenService.getAccessToken();
      const url = new URL(path, `https://${env.BATTLENET_REGION}.api.blizzard.com`);

      url.searchParams.set("namespace", `static-${env.BATTLENET_REGION}`);
      url.searchParams.set("locale", env.BATTLENET_LOCALE);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.ok ? ((await response.json()) as T) : null;
    } catch {
      return null;
    }
  }
}

function toSummaries(
  refs: NamedRef[] | undefined,
  kind: JournalInstanceKind
): JournalInstanceSummary[] {
  return (refs ?? []).flatMap((ref) =>
    typeof ref.id === "number" && ref.name
      ? [{ id: ref.id, name: ref.name, kind }]
      : []
  );
}
