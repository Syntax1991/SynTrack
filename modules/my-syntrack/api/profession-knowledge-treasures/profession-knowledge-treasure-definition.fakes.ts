import type {
  ProfessionKnowledgeTreasureDefinitionRepositoryContract,
  ProfessionKnowledgeTreasureDefinitionRow
} from "./profession-knowledge-treasure-definition-repository.types.js";
import type { ProfessionKnowledgeTreasureDefinitionSeedInput } from "./profession-knowledge-treasure-definition.types.js";

export class FakeProfessionKnowledgeTreasureDefinitionRepository
  implements ProfessionKnowledgeTreasureDefinitionRepositoryContract
{
  private readonly rows: ProfessionKnowledgeTreasureDefinitionRow[] =
    [];

  async findByScopeKeys(scopeKeys: string[]) {
    return this.rows.filter((row) =>
      scopeKeys.includes(row.scopeKey)
    );
  }

  async upsertByScopeProfessionSource(
    input: ProfessionKnowledgeTreasureDefinitionSeedInput
  ) {
    const existing = this.rows.find(
      (row) =>
        row.scopeKey === input.scopeKey &&
        row.professionKey === input.professionKey &&
        row.sourceKey === input.sourceKey
    );

    const row: ProfessionKnowledgeTreasureDefinitionRow = {
      id: existing?.id ?? `def-${this.rows.length + 1}`,
      scopeKey: input.scopeKey,
      professionKey: input.professionKey,
      sourceKey: input.sourceKey,
      name: input.name,
      externalQuestId: input.externalQuestId,
      knowledgePoints: input.knowledgePoints ?? null,
      enabled: input.enabled ?? false,
      sortOrder: input.sortOrder ?? 0,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date()
    };

    if (existing) {
      Object.assign(existing, row);
    }
    else {
      this.rows.push(row);
    }

    return row;
  }
}

export class FakeActiveScopeLookup {
  constructor(
    private readonly active: { key: string } | null = null
  ) {}

  async getActive() {
    return this.active;
  }
}
