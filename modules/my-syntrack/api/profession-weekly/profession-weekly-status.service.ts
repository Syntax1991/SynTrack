import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { ProfessionWeeklyDefinitionRepository } from "./profession-weekly-definition.repository.js";
import { ProfessionWeeklyDefinitionService } from "./profession-weekly-definition.service.js";
import type { ProfessionWeeklySourceDefinitionView } from "./profession-weekly-definition.types.js";
import type {
  ProfessionWeeklyCharacterRow,
  ProfessionWeeklySnapshotRow,
  ProfessionWeeklyStatusRepositoryContract
} from "./profession-weekly-status-repository.types.js";
import type {
  CharacterProfessionWeeklyStatus,
  ProfessionWeeklyAggregate,
  ProfessionWeeklyProfessionSummary,
  ProfessionWeeklySourceStatus
} from "./profession-weekly-status.types.js";

export type ProfessionWeeklyDefinitionLookup = {
  listEnabledForActiveSeason(): Promise<
    ProfessionWeeklySourceDefinitionView[]
  >;
};

function emptyAggregate(): ProfessionWeeklyAggregate {
  return {
    completeCount: 0,
    incompleteCount: 0,
    unknownCount: 0,
    applicableTotal: 0
  };
}

function accumulate(
  aggregate: ProfessionWeeklyAggregate,
  state: ProfessionWeeklySourceStatus["state"]
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
  definition: ProfessionWeeklySourceDefinitionView,
  row: ProfessionWeeklySnapshotRow | undefined
): ProfessionWeeklySourceStatus {
  return {
    sourceKey: definition.sourceKey,
    name: definition.name,
    sourceType: definition.sourceType,
    state:
      (row?.state as ProfessionWeeklySourceStatus["state"]) ??
      "UNKNOWN",
    currentValue: row?.currentValue ?? null,
    maxValue: row?.maxValue ?? null,
    capturedAt: row?.capturedAt.toISOString() ?? null
  };
}

/*
 * Read model composed from ProfessionWeeklySourceDefinition (config) +
 * CharacterProfessionWeeklySnapshot (raw authoritative game state) for
 * the CURRENT weekly period only - it persists nothing. Prof KP is
 * derived strictly from WEEKLY_QUEST/TREATISE sources; KNOWLEDGE_DROPS
 * ("drops") is tracked in a fully separate aggregate and never folds
 * into Prof KP, per the product's hard rule. A profession with zero
 * enabled definitions never appears at all - that is NOT_APPLICABLE by
 * construction, not a false zero.
 */
export class ProfessionWeeklyStatusService {
  constructor(
    private readonly repository: ProfessionWeeklyStatusRepositoryContract,
    private readonly definitionService: ProfessionWeeklyDefinitionLookup =
      new ProfessionWeeklyDefinitionService(
        new ProfessionWeeklyDefinitionRepository()
      )
  ) {}

  async getOverview(): Promise<{
    characters: CharacterProfessionWeeklyStatus[];
  }> {
    const definitions =
      await this.definitionService.listEnabledForActiveSeason();

    const definitionIds = definitions.map(
      (definition) => definition.id
    );

    const periodKey = getWeeklyPeriod().key;

    const professionKeys = [
      ...new Set(
        definitions.map((definition) => definition.professionKey)
      )
    ];

    const [characters, snapshots, professionNames] =
      await Promise.all([
        this.repository.findCharacters(),
        this.repository.findSnapshotsForPeriod(
          definitionIds,
          periodKey
        ),
        this.repository.findProfessionNamesByKeys(professionKeys)
      ]);

    const snapshotByKey = new Map<
      string,
      ProfessionWeeklySnapshotRow
    >(
      snapshots.map((row) => [
        `${row.characterId}:${row.sourceDefinitionId}`,
        row
      ])
    );

    const definitionsByProfession = new Map<
      string,
      ProfessionWeeklySourceDefinitionView[]
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

    const characterStatuses: CharacterProfessionWeeklyStatus[] =
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
    character: ProfessionWeeklyCharacterRow,
    definitionsByProfession: Map<
      string,
      ProfessionWeeklySourceDefinitionView[]
    >,
    professionNames: Map<string, string>,
    snapshotByKey: Map<string, ProfessionWeeklySnapshotRow>
  ): CharacterProfessionWeeklyStatus {
    const profKp = emptyAggregate();
    const drops = emptyAggregate();
    const professions: ProfessionWeeklyProfessionSummary[] = [];

    for (const professionKey of character.professionKeys) {
      const professionDefinitions =
        definitionsByProfession.get(professionKey);

      if (!professionDefinitions) {
        continue;
      }

      const sources: ProfessionWeeklySourceStatus[] = [];
      const professionProfKp = emptyAggregate();
      let dropsStatus: ProfessionWeeklySourceStatus | null = null;

      const sorted = [...professionDefinitions].sort(
        (left, right) => left.sortOrder - right.sortOrder
      );

      for (const definition of sorted) {
        const row = snapshotByKey.get(
          `${character.id}:${definition.id}`
        );

        const status = toSourceStatus(definition, row);

        if (definition.sourceType === "KNOWLEDGE_DROPS") {
          dropsStatus = status;
          accumulate(drops, status.state);
        }
        else {
          sources.push(status);
          accumulate(professionProfKp, status.state);
          accumulate(profKp, status.state);
        }
      }

      professions.push({
        professionKey,
        name: professionNames.get(professionKey) ?? professionKey,
        profKp: professionProfKp,
        sources,
        drops: dropsStatus
      });
    }

    professions.sort((left, right) =>
      left.name.localeCompare(right.name)
    );

    return {
      id: character.id,
      name: character.name,
      profKp,
      drops,
      professions
    };
  }
}
