import type {
  ProfessionWeeklySourceDefinitionRepositoryContract,
  ProfessionWeeklySourceDefinitionRow
} from "./profession-weekly-definition-repository.types.js";
import type { ProfessionWeeklySourceDefinitionSeedInput } from "./profession-weekly-definition.types.js";

function rowKey(
  scopeKey: string,
  professionKey: string,
  sourceKey: string
) {
  return `${scopeKey}:${professionKey}:${sourceKey}`;
}

export class FakeProfessionWeeklyDefinitionRepository
  implements ProfessionWeeklySourceDefinitionRepositoryContract
{
  private readonly rows = new Map<
    string,
    ProfessionWeeklySourceDefinitionRow
  >();

  private nextId = 1;

  seed(
    row: Partial<ProfessionWeeklySourceDefinitionRow> & {
      scopeKey: string;
      professionKey: string;
      sourceKey: string;
    }
  ) {
    const now = new Date();

    const id = row.id ?? `pwsd-${this.nextId++}`;

    this.rows.set(
      rowKey(row.scopeKey, row.professionKey, row.sourceKey),
      {
        id,
        scopeKey: row.scopeKey,
        professionKey: row.professionKey,
        sourceKey: row.sourceKey,
        name: row.name ?? row.sourceKey,
        sourceType: row.sourceType ?? "WEEKLY_QUEST",
        externalQuestId: row.externalQuestId ?? null,
        externalCurrencyId: row.externalCurrencyId ?? null,
        enabled: row.enabled ?? false,
        sortOrder: row.sortOrder ?? 0,
        createdAt: row.createdAt ?? now,
        updatedAt: row.updatedAt ?? now
      }
    );
  }

  async findByScopeKeys(scopeKeys: string[]) {
    return [...this.rows.values()].filter((row) =>
      scopeKeys.includes(row.scopeKey)
    );
  }

  async upsertByScopeProfessionSource(
    input: ProfessionWeeklySourceDefinitionSeedInput
  ) {
    const key = rowKey(
      input.scopeKey,
      input.professionKey,
      input.sourceKey
    );

    const existing = this.rows.get(key);
    const now = new Date();

    const row: ProfessionWeeklySourceDefinitionRow = {
      id: existing?.id ?? `pwsd-${this.nextId++}`,
      scopeKey: input.scopeKey,
      professionKey: input.professionKey,
      sourceKey: input.sourceKey,
      name: input.name,
      sourceType: input.sourceType,
      externalQuestId: input.externalQuestId ?? null,
      externalCurrencyId: input.externalCurrencyId ?? null,
      enabled: input.enabled ?? false,
      sortOrder: input.sortOrder ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.rows.set(key, row);

    return row;
  }
}

export class FakeActiveScopeLookup {
  constructor(private readonly activeKey: string | null) {}

  async getActive() {
    return this.activeKey ? { key: this.activeKey } : null;
  }
}
