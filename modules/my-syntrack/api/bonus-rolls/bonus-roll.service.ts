import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { BonusRollCatalogService } from "./bonus-roll-catalog.service.js";
import type {
  BonusRollOutcome,
  BonusRollRepositoryContract,
  BonusRollRowWithCharacter,
  BonusRollStatus,
  BonusRollUpdateData,
  BonusRollView
} from "./bonus-roll.types.js";
import type {
  BonusRollCreateInput,
  BonusRollResultInput,
  BonusRollUpdateInput
} from "./bonus-roll.validation.js";

export class BonusRollService {
  constructor(
    private readonly repository: BonusRollRepositoryContract,
    private readonly catalog: BonusRollCatalogService,
    private readonly now: () => Date = () => new Date()
  ) {}

  async list(): Promise<BonusRollView[]> {
    return (await this.repository.findAll()).map(toView);
  }

  async create(input: BonusRollCreateInput): Promise<BonusRollView> {
    if (!(await this.repository.findCharacterExists(input.characterId))) {
      throw new AppError(404, "Character not found.");
    }

    const { instance, encounter } = await this.catalog.requireEncounter(
      input.instanceId,
      input.encounterId
    );

    const target = typeof input.targetItemId === "number"
      ? await this.catalog.requireLootItem(instance.id, encounter.id, input.targetItemId)
      : null;

    const row = await this.repository.create({
      characterId: input.characterId,
      instanceId: instance.id,
      instanceName: instance.name,
      encounterId: encounter.id,
      encounterName: encounter.name,
      targetItemId: target?.id ?? null,
      targetItemName: target?.name ?? null,
      targetItemIcon: target?.iconUrl ?? null,
      note: input.note ?? null
    });

    return toView(row);
  }

  async update(id: string, input: BonusRollUpdateInput): Promise<BonusRollView> {
    const row = await this.require(id);
    const data: BonusRollUpdateData = {};

    if (input.targetItemId !== undefined) {
      const target = input.targetItemId === null
        ? null
        : await this.catalog.requireLootItem(row.instanceId, row.encounterId, input.targetItemId);

      data.targetItemId = target?.id ?? null;
      data.targetItemName = target?.name ?? null;
      data.targetItemIcon = target?.iconUrl ?? null;
    }

    if (input.note !== undefined) {
      data.note = input.note;
    }

    return toView(await this.repository.update(id, data));
  }

  async recordResult(id: string, input: BonusRollResultInput): Promise<BonusRollView> {
    const row = await this.require(id);

    const received = input.outcome === "ITEM" && typeof input.receivedItemId === "number"
      ? await this.catalog.requireLootItem(row.instanceId, row.encounterId, input.receivedItemId)
      : null;

    return toView(
      await this.repository.update(id, {
        status: "ROLLED",
        outcome: input.outcome,
        receivedItemId: received?.id ?? null,
        receivedItemName: received?.name ?? null,
        receivedItemIcon: received?.iconUrl ?? null,
        rolledAt: input.rolledAt ?? this.now()
      })
    );
  }

  async clearResult(id: string): Promise<BonusRollView> {
    await this.require(id);

    return toView(
      await this.repository.update(id, {
        status: "PLANNED",
        outcome: null,
        receivedItemId: null,
        receivedItemName: null,
        receivedItemIcon: null,
        rolledAt: null
      })
    );
  }

  async delete(id: string): Promise<void> {
    await this.require(id);
    await this.repository.delete(id);
  }

  private async require(id: string): Promise<BonusRollRowWithCharacter> {
    const row = await this.repository.findById(id);

    if (!row) {
      throw new AppError(404, "Bonus roll not found.");
    }

    return row;
  }
}

export function toView(row: BonusRollRowWithCharacter): BonusRollView {
  const status: BonusRollStatus = row.status === "ROLLED" ? "ROLLED" : "PLANNED";
  const outcome: BonusRollOutcome | null =
    status === "ROLLED" && (row.outcome === "ITEM" || row.outcome === "NO_ITEM") ? row.outcome : null;

  const receivedItem = outcome === "ITEM" && row.receivedItemId !== null && row.receivedItemName
    ? { id: row.receivedItemId, name: row.receivedItemName, iconUrl: row.receivedItemIcon }
    : null;

  return {
    id: row.id,
    character: row.character,
    instance: { id: row.instanceId, name: row.instanceName },
    encounter: { id: row.encounterId, name: row.encounterName },
    targetItem: row.targetItemId !== null && row.targetItemName
      ? { id: row.targetItemId, name: row.targetItemName, iconUrl: row.targetItemIcon }
      : null,
    status,
    outcome,
    receivedItem,
    gotTarget: receivedItem !== null && receivedItem.id === row.targetItemId,
    note: row.note,
    rolledAt: status === "ROLLED" && row.rolledAt ? row.rolledAt.toISOString() : null,
    createdAt: row.createdAt.toISOString()
  };
}
