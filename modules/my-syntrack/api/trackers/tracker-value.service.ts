import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { resolveTrackerPeriodKey } from "./tracker-period.js";
import type {
  TrackerDefinitionRepositoryContract,
  TrackerValueRepositoryContract
} from "./tracker-repository.types.js";
import { buildTrackerValueColumns } from "./tracker-value-invariants.js";
import { mapToCharacterTrackerState } from "./tracker-value-state.mapper.js";
import type {
  CharacterTrackerState,
  TrackerResetBehavior,
  TrackerValueInput,
  TrackerValueType
} from "./tracker.types.js";

/*
 * The single authoritative write path for tracker values. Every normal
 * set/clear must go through this service - it is the only place that
 * resolves periodKey from resetBehavior, validates a payload against
 * valueType, and clears irrelevant typed columns. No route/consumer is
 * ever allowed to supply periodKey directly for a write.
 */
export class TrackerValueService {
  constructor(
    private readonly valueRepository: TrackerValueRepositoryContract,
    private readonly definitionRepository: TrackerDefinitionRepositoryContract
  ) {}

  async setValue(
    trackerDefinitionId: string,
    characterId: string,
    input: TrackerValueInput,
    source = "MANUAL"
  ): Promise<CharacterTrackerState> {
    const definition =
      await this.requireDefinition(
        trackerDefinitionId
      );

    if (!definition.enabled) {
      throw new AppError(
        409,
        "Cannot record a new value for a disabled tracker."
      );
    }

    const periodKey =
      resolveTrackerPeriodKey(
        definition.resetBehavior as TrackerResetBehavior
      );

    const columns =
      buildTrackerValueColumns(
        definition.valueType as TrackerValueType,
        input
      );

    const row =
      await this.valueRepository.upsert(
        trackerDefinitionId,
        characterId,
        periodKey,
        columns,
        source
      );

    return mapToCharacterTrackerState(
      trackerDefinitionId,
      characterId,
      periodKey,
      definition.valueType as TrackerValueType,
      row
    );
  }

  async clearValue(
    trackerDefinitionId: string,
    characterId: string
  ): Promise<CharacterTrackerState> {
    const definition =
      await this.requireDefinition(
        trackerDefinitionId
      );

    const periodKey =
      resolveTrackerPeriodKey(
        definition.resetBehavior as TrackerResetBehavior
      );

    await this.valueRepository.delete(
      trackerDefinitionId,
      characterId,
      periodKey
    );

    return mapToCharacterTrackerState(
      trackerDefinitionId,
      characterId,
      periodKey,
      definition.valueType as TrackerValueType,
      null
    );
  }

  async getStatesForScope(
    scopeKey: string,
    characterIds: string[],
    periodOverride?: string
  ): Promise<CharacterTrackerState[]> {
    const definitions =
      await this.definitionRepository.findByScope(
        scopeKey
      );

    const periodKeyByDefinitionId =
      new Map<string, string>(
        definitions.map((definition) => [
          definition.id,
          periodOverride ??
            resolveTrackerPeriodKey(
              definition.resetBehavior as TrackerResetBehavior
            )
        ])
      );

    const definitionIdsByPeriodKey =
      new Map<string, string[]>();

    for (const [
      definitionId,
      periodKey
    ] of periodKeyByDefinitionId) {
      const existing =
        definitionIdsByPeriodKey.get(
          periodKey
        ) ?? [];

      existing.push(definitionId);
      definitionIdsByPeriodKey.set(
        periodKey,
        existing
      );
    }

    const rows =
      await this.valueRepository.findByDefinitionGroups(
        definitionIdsByPeriodKey,
        characterIds
      );

    const rowByCompositeKey = new Map(
      rows.map((row) => [
        `${row.trackerDefinitionId}:${row.characterId}:${row.periodKey}`,
        row
      ])
    );

    const states: CharacterTrackerState[] =
      [];

    for (const characterId of characterIds) {
      for (const definition of definitions) {
        const periodKey =
          periodKeyByDefinitionId.get(
            definition.id
          )!;

        const row =
          rowByCompositeKey.get(
            `${definition.id}:${characterId}:${periodKey}`
          ) ?? null;

        states.push(
          mapToCharacterTrackerState(
            definition.id,
            characterId,
            periodKey,
            definition.valueType as TrackerValueType,
            row
          )
        );
      }
    }

    return states;
  }

  private async requireDefinition(
    id: string
  ) {
    const definition =
      await this.definitionRepository.findById(
        id
      );

    if (!definition) {
      throw new AppError(
        404,
        "Tracker definition not found."
      );
    }

    return definition;
  }
}
