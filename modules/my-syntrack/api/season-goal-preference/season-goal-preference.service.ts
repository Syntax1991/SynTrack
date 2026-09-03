import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import {
  SEASON_GOAL_DEFINITIONS,
  SEASON_RAID_ENUM_OPTIONS,
  findSeasonGoalDefinition,
  type SeasonGoalDefinition
} from "./season-goal-definitions.js";
import { SeasonGoalPreferenceRepository } from "./season-goal-preference.repository.js";
import {
  SEASON_GOAL_PREFERENCE_WARBAND_SCOPE,
  type SeasonGoalPreferenceInput,
  type SeasonGoalPreferenceRow,
  type SeasonGoalPreferenceValue
} from "./season-goal-preference.types.js";

const MAX_NUMERIC_TARGET = 99999;

function defaultValue(
  definition: SeasonGoalDefinition
): SeasonGoalPreferenceValue {
  return {
    enabled: definition.defaultEnabled,
    numericTarget: definition.defaultNumericTarget,
    enumTarget: definition.defaultEnumTarget
  };
}

/** Override row (if any) merged onto the catalog default — never partial. */
function effectiveValue(
  definition: SeasonGoalDefinition,
  override: SeasonGoalPreferenceRow | undefined
): SeasonGoalPreferenceValue {
  if (!override) {
    return defaultValue(definition);
  }

  return {
    enabled: override.enabled,
    numericTarget: override.numericTarget,
    enumTarget: override.enumTarget
  };
}

function validateInput(input: SeasonGoalPreferenceInput): SeasonGoalDefinition {
  const definition = findSeasonGoalDefinition(input.goalKey);

  if (!definition) {
    throw new AppError(400, `Unknown Season goal: ${input.goalKey}`);
  }

  if (definition.scope === "CHARACTER" && !input.characterId) {
    throw new AppError(
      400,
      `${input.goalKey} is a Character-scoped goal and requires a characterId`
    );
  }

  if (definition.scope === "WARBAND" && input.characterId) {
    throw new AppError(
      400,
      `${input.goalKey} is a Warband-scoped goal and must not specify a characterId`
    );
  }

  if (input.enabled && definition.targetType === "NUMBER") {
    if (
      input.numericTarget === null ||
      !Number.isInteger(input.numericTarget) ||
      input.numericTarget < (definition.minNumericTarget ?? 1) ||
      input.numericTarget > MAX_NUMERIC_TARGET
    ) {
      throw new AppError(
        400,
        `${input.goalKey} requires a numeric target >= ${definition.minNumericTarget ?? 1}`
      );
    }
  }

  if (input.enabled && definition.targetType === "ENUM") {
    if (
      !input.enumTarget ||
      !(definition.enumOptions ?? []).includes(input.enumTarget)
    ) {
      throw new AppError(
        400,
        `${input.goalKey} requires one of: ${(definition.enumOptions ?? []).join(", ")}`
      );
    }
  }

  return definition;
}

export class SeasonGoalPreferenceService {
  constructor(
    private readonly repository: SeasonGoalPreferenceRepository = new SeasonGoalPreferenceRepository()
  ) {}

  async getEffectivePreferencesByCharacter(
    characterIds: string[]
  ): Promise<Map<string, Map<string, SeasonGoalPreferenceValue>>> {
    const rows = await this.repository.findAll();
    const rowsByCharacterAndGoal = new Map(
      rows.map((row) => [`${row.characterId}::${row.goalKey}`, row])
    );

    const characterDefinitions = SEASON_GOAL_DEFINITIONS.filter(
      (definition) => definition.scope === "CHARACTER"
    );

    const result = new Map<string, Map<string, SeasonGoalPreferenceValue>>();
    for (const characterId of characterIds) {
      const byGoal = new Map<string, SeasonGoalPreferenceValue>();
      for (const definition of characterDefinitions) {
        byGoal.set(
          definition.key,
          effectiveValue(
            definition,
            rowsByCharacterAndGoal.get(`${characterId}::${definition.key}`)
          )
        );
      }
      result.set(characterId, byGoal);
    }

    return result;
  }

  async getEffectiveWarbandPreferences(): Promise<
    Map<string, SeasonGoalPreferenceValue>
  > {
    const rows = await this.repository.findAll();
    const rowsByGoal = new Map(
      rows
        .filter(
          (row) => row.characterId === SEASON_GOAL_PREFERENCE_WARBAND_SCOPE
        )
        .map((row) => [row.goalKey, row])
    );

    const warbandDefinitions = SEASON_GOAL_DEFINITIONS.filter(
      (definition) => definition.scope === "WARBAND"
    );

    return new Map(
      warbandDefinitions.map((definition) => [
        definition.key,
        effectiveValue(definition, rowsByGoal.get(definition.key))
      ])
    );
  }

  /** Manage Goals UI payload: every definition + every gameplay Character's
   * effective preference + the Warband's effective preferences. */
  async getManageGoalsView(
    characters: Array<{ id: string; name: string; realm: string; className: string }>
  ) {
    const characterIds = characters.map((character) => character.id);
    const [byCharacter, warband] = await Promise.all([
      this.getEffectivePreferencesByCharacter(characterIds),
      this.getEffectiveWarbandPreferences()
    ]);

    return {
      definitions: SEASON_GOAL_DEFINITIONS,
      characters: characters.map((character) => ({
        id: character.id,
        name: character.name,
        realm: character.realm,
        className: character.className,
        preferences: Object.fromEntries(
          byCharacter.get(character.id) ?? new Map()
        )
      })),
      warband: Object.fromEntries(warband)
    };
  }

  async savePreference(
    input: SeasonGoalPreferenceInput
  ): Promise<SeasonGoalPreferenceValue> {
    const definition = validateInput(input);
    const characterId =
      definition.scope === "WARBAND"
        ? SEASON_GOAL_PREFERENCE_WARBAND_SCOPE
        : (input.characterId as string);

    const row = await this.repository.upsert(input.goalKey, characterId, {
      enabled: input.enabled,
      numericTarget: definition.targetType === "NUMBER" ? input.numericTarget : null,
      enumTarget: definition.targetType === "ENUM" ? input.enumTarget : null
    });

    return {
      enabled: row.enabled,
      numericTarget: row.numericTarget,
      enumTarget: row.enumTarget
    };
  }

  async resetPreference(
    goalKey: string,
    characterId: string | null
  ): Promise<SeasonGoalPreferenceValue> {
    const definition = findSeasonGoalDefinition(goalKey);

    if (!definition) {
      throw new AppError(400, `Unknown Season goal: ${goalKey}`);
    }

    if (definition.scope === "CHARACTER" && !characterId) {
      throw new AppError(
        400,
        `${goalKey} is a Character-scoped goal and requires a characterId`
      );
    }

    if (definition.scope === "WARBAND" && characterId) {
      throw new AppError(
        400,
        `${goalKey} is a Warband-scoped goal and must not specify a characterId`
      );
    }

    const resolvedCharacterId =
      definition.scope === "WARBAND"
        ? SEASON_GOAL_PREFERENCE_WARBAND_SCOPE
        : (characterId as string);

    await this.repository.delete(goalKey, resolvedCharacterId);

    return defaultValue(definition);
  }
}

export { SEASON_RAID_ENUM_OPTIONS };
