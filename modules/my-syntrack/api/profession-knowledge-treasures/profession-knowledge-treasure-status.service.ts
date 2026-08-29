import { ProfessionKnowledgeTreasureDefinitionRepository } from "./profession-knowledge-treasure-definition.repository.js";
import { ProfessionKnowledgeTreasureDefinitionService } from "./profession-knowledge-treasure-definition.service.js";
import type { ProfessionKnowledgeTreasureDefinitionView } from "./profession-knowledge-treasure-definition.types.js";
import type {
  ProfessionKnowledgeTreasureCharacterRow,
  ProfessionKnowledgeTreasureSnapshotRow,
  ProfessionKnowledgeTreasureStatusRepositoryContract
} from "./profession-knowledge-treasure-status-repository.types.js";
import type {
  CharacterProfessionKnowledgeTreasureStatus,
  ProfessionKnowledgeTreasureAggregate,
  ProfessionKnowledgeTreasureProfessionSummary,
  ProfessionKnowledgeTreasureSourceStatus
} from "./profession-knowledge-treasure-status.types.js";

export type ProfessionKnowledgeTreasureDefinitionLookup = {
  listEnabledForActiveSeason(): Promise<
    ProfessionKnowledgeTreasureDefinitionView[]
  >;
};

function emptyAggregate(): ProfessionKnowledgeTreasureAggregate {
  return {
    completeCount: 0,
    incompleteCount: 0,
    unknownCount: 0,
    applicableTotal: 0
  };
}

function accumulate(
  aggregate: ProfessionKnowledgeTreasureAggregate,
  state: ProfessionKnowledgeTreasureSourceStatus["state"]
): void {
  aggregate.applicableTotal += 1;

  if (state === "COMPLETE") {
    aggregate.completeCount += 1;
  }
  else if (state === "INCOMPLETE") {
    aggregate.incompleteCount += 1;
  }
  else {
    aggregate.unknownCount += 1;
  }
}

function toSourceStatus(
  definition: ProfessionKnowledgeTreasureDefinitionView,
  row: ProfessionKnowledgeTreasureSnapshotRow | undefined
): ProfessionKnowledgeTreasureSourceStatus {
  return {
    sourceKey: definition.sourceKey,
    name: definition.name,
    state:
      (row?.state as ProfessionKnowledgeTreasureSourceStatus["state"]) ??
      "UNKNOWN",
    capturedAt: row?.capturedAt.toISOString() ?? null
  };
}

/*
 * Read model composed from ProfessionKnowledgeTreasureDefinition
 * (config) + CharacterProfessionKnowledgeTreasureSnapshot (permanent
 * raw evidence, no weekly period) - it persists nothing. Fully
 * separate from ProfessionWeeklyStatusService: a treasure never resets
 * and never affects Quest/Treatise/Drops, and vice versa. A profession
 * the character doesn't practice never appears at all (mirrors the
 * phantom-profession fix already applied to the weekly read model).
 */
export class ProfessionKnowledgeTreasureStatusService {
  constructor(
    private readonly repository: ProfessionKnowledgeTreasureStatusRepositoryContract,
    private readonly definitionService: ProfessionKnowledgeTreasureDefinitionLookup =
      new ProfessionKnowledgeTreasureDefinitionService(
        new ProfessionKnowledgeTreasureDefinitionRepository()
      )
  ) {}

  async getOverview(): Promise<{
    characters: CharacterProfessionKnowledgeTreasureStatus[];
  }> {
    const definitions =
      await this.definitionService.listEnabledForActiveSeason();

    const definitionIds = definitions.map(
      (definition) => definition.id
    );

    const professionKeys = [
      ...new Set(
        definitions.map((definition) => definition.professionKey)
      )
    ];

    const [characters, snapshots, professionNames] =
      await Promise.all([
        this.repository.findCharacters(),
        this.repository.findSnapshots(definitionIds),
        this.repository.findProfessionNamesByKeys(professionKeys)
      ]);

    const snapshotByKey = new Map<
      string,
      ProfessionKnowledgeTreasureSnapshotRow
    >(
      snapshots.map((row) => [
        `${row.characterId}:${row.definitionId}`,
        row
      ])
    );

    const definitionsByProfession = new Map<
      string,
      ProfessionKnowledgeTreasureDefinitionView[]
    >();

    for (const definition of definitions) {
      const existing =
        definitionsByProfession.get(
          definition.professionKey
        ) ?? [];

      existing.push(definition);

      definitionsByProfession.set(
        definition.professionKey,
        existing
      );
    }

    const characterStatuses: CharacterProfessionKnowledgeTreasureStatus[] =
      characters.map((character) =>
        this.resolveCharacter(
          character,
          definitionsByProfession,
          professionNames,
          snapshotByKey
        )
      );

    return { characters: characterStatuses };
  }

  private resolveCharacter(
    character: ProfessionKnowledgeTreasureCharacterRow,
    definitionsByProfession: Map<
      string,
      ProfessionKnowledgeTreasureDefinitionView[]
    >,
    professionNames: Map<string, string>,
    snapshotByKey: Map<string, ProfessionKnowledgeTreasureSnapshotRow>
  ): CharacterProfessionKnowledgeTreasureStatus {
    const treasures = emptyAggregate();
    const professions: ProfessionKnowledgeTreasureProfessionSummary[] =
      [];

    for (const professionKey of character.professionKeys) {
      const professionDefinitions =
        definitionsByProfession.get(professionKey);

      if (!professionDefinitions) {
        continue;
      }

      const sources: ProfessionKnowledgeTreasureSourceStatus[] = [];
      const professionTreasures = emptyAggregate();

      const sorted = [...professionDefinitions].sort(
        (left, right) => left.sortOrder - right.sortOrder
      );

      for (const definition of sorted) {
        const row = snapshotByKey.get(
          `${character.id}:${definition.id}`
        );

        const status = toSourceStatus(definition, row);

        sources.push(status);
        accumulate(professionTreasures, status.state);
        accumulate(treasures, status.state);
      }

      professions.push({
        professionKey,
        name: professionNames.get(professionKey) ?? professionKey,
        treasures: professionTreasures,
        sources
      });
    }

    professions.sort((left, right) =>
      left.name.localeCompare(right.name)
    );

    return {
      id: character.id,
      name: character.name,
      treasures,
      professions
    };
  }
}
