import type {
  JournalClient,
  JournalEncounterSummary,
  JournalInstanceSummary,
  JournalLootItem
} from "../../../data-platform/api/integrations/battlenet/battlenet-journal.service.js";
import type {
  BonusRollCharacterRef,
  BonusRollCreateData,
  BonusRollRepositoryContract,
  BonusRollRowWithCharacter,
  BonusRollUpdateData
} from "./bonus-roll.types.js";

export class FakeBonusRollRepository implements BonusRollRepositoryContract {
  rows: BonusRollRowWithCharacter[] = [];
  private sequence = 0;

  constructor(private readonly characters: BonusRollCharacterRef[]) {}

  async findAll() {
    return [...this.rows];
  }

  async findById(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async create(data: BonusRollCreateData) {
    const character = this.characters.find((entry) => entry.id === data.characterId)!;
    const now = new Date("2026-10-22T10:00:00.000Z");
    const row: BonusRollRowWithCharacter = {
      ...data,
      id: `roll-${++this.sequence}`,
      status: "PLANNED",
      outcome: null,
      receivedItemId: null,
      receivedItemName: null,
      receivedItemIcon: null,
      rolledAt: null,
      createdAt: now,
      updatedAt: now,
      character
    };

    this.rows.push(row);
    return row;
  }

  async update(id: string, data: BonusRollUpdateData) {
    const index = this.rows.findIndex((row) => row.id === id);
    const updated: BonusRollRowWithCharacter = { ...this.rows[index]!, ...data };
    this.rows[index] = updated;
    return updated;
  }

  async delete(id: string) {
    this.rows = this.rows.filter((row) => row.id !== id);
  }

  async findCharacterExists(characterId: string) {
    return this.characters.some((entry) => entry.id === characterId);
  }
}

export class FakeJournalClient implements JournalClient {
  calls = { instances: 0, encounters: 0, loot: 0 };
  failNext = false;

  constructor(
    readonly instances: JournalInstanceSummary[],
    readonly encounters: Record<number, JournalEncounterSummary[]>,
    readonly loot: Record<number, JournalLootItem[]>
  ) {}

  async listCurrentSeasonInstances() {
    this.calls.instances++;
    return this.takeFailure() ? [] : this.instances;
  }

  async listInstanceEncounters(instanceId: number) {
    this.calls.encounters++;
    return this.takeFailure() ? null : this.encounters[instanceId] ?? null;
  }

  async listEncounterLoot(encounterId: number) {
    this.calls.loot++;
    return this.takeFailure() ? null : this.loot[encounterId] ?? null;
  }

  private takeFailure() {
    const fail = this.failNext;
    this.failNext = false;
    return fail;
  }
}

export function sampleJournal() {
  return new FakeJournalClient(
    [
      { id: 1320, name: "The Venomous Abyss", kind: "RAID" },
      { id: 1322, name: "Altar of Fangs", kind: "DUNGEON" }
    ],
    {
      1320: [
        { id: 2888, name: "Nek'zali the Soulwinder" },
        { id: 2895, name: "Ula'tek" }
      ],
      1322: [{ id: 3001, name: "First Boss" }]
    },
    {
      2895: [
        { id: 900001, name: "Fang of the Abyss", slot: "One-Hand", quality: "EPIC", iconUrl: "https://render.example/fang.jpg" },
        { id: 900002, name: "Venomscale Helm", slot: "Head", quality: "EPIC", iconUrl: "https://render.example/helm.jpg" }
      ],
      2888: [{ id: 900010, name: "Soulwinder Ring", slot: "Finger", quality: "EPIC", iconUrl: null }]
    }
  );
}
