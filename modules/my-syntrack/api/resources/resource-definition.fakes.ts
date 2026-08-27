import type {
  ResourceDefinitionRepositoryContract,
  ResourceDefinitionRow
} from "./resource-definition-repository.types.js";
import type { ResourceDefinitionSeedInput } from "./resource-definition.types.js";

export class FakeResourceDefinitionRepository
  implements ResourceDefinitionRepositoryContract
{
  private readonly rows = new Map<
    string,
    ResourceDefinitionRow
  >();

  private nextId = 1;

  seed(
    row: Partial<ResourceDefinitionRow> & {
      key: string;
      scopeKey: string;
    }
  ) {
    const now = new Date();

    const id = row.id ?? `resource-def-${this.nextId++}`;

    this.rows.set(row.key, {
      id,
      key: row.key,
      scopeKey: row.scopeKey,
      externalCurrencyId:
        row.externalCurrencyId ?? null,
      externalItemId: row.externalItemId ?? null,
      name: row.name ?? row.key,
      category: row.category ?? "OTHER",
      resetBehavior: row.resetBehavior ?? "WEEKLY",
      ownershipScope:
        row.ownershipScope ?? "UNKNOWN",
      enabled: row.enabled ?? true,
      sortOrder: row.sortOrder ?? 0,
      createdAt: row.createdAt ?? now,
      updatedAt: row.updatedAt ?? now
    });
  }

  async findByScopeKeys(scopeKeys: string[]) {
    return [...this.rows.values()].filter((row) =>
      scopeKeys.includes(row.scopeKey)
    );
  }

  async findByKey(key: string) {
    return this.rows.get(key) ?? null;
  }

  async upsertByKey(input: ResourceDefinitionSeedInput) {
    const existing = this.rows.get(input.key);
    const now = new Date();

    const row: ResourceDefinitionRow = {
      id: existing?.id ?? `resource-def-${this.nextId++}`,
      key: input.key,
      scopeKey: input.scopeKey,
      externalCurrencyId:
        input.externalCurrencyId ?? null,
      externalItemId: input.externalItemId ?? null,
      name: input.name,
      category: input.category,
      resetBehavior: input.resetBehavior,
      ownershipScope: input.ownershipScope,
      enabled: input.enabled ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.rows.set(input.key, row);

    return row;
  }
}

export class FakeActiveScopeLookup {
  constructor(
    private readonly activeKey: string | null
  ) {}

  async getActive() {
    return this.activeKey
      ? { key: this.activeKey }
      : null;
  }
}
