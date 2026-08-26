import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import {
  normalizeTrackerKey,
  normalizeTrackerScopeKey
} from "./tracker-key.js";
import type {
  TrackerDefinitionRepositoryContract,
  TrackerDefinitionRow
} from "./tracker-repository.types.js";
import type {
  TrackerDefinitionCreateInput,
  TrackerDefinitionMetadataUpdate,
  TrackerDefinitionView
} from "./tracker.types.js";

function toView(
  definition: TrackerDefinitionRow | null
): TrackerDefinitionView {
  if (!definition) {
    throw new AppError(
      404,
      "Tracker definition not found."
    );
  }

  return {
    id: definition.id,
    scopeKey: definition.scopeKey,
    key: definition.key,
    name: definition.name,
    valueType:
      definition.valueType as TrackerDefinitionView["valueType"],
    resetBehavior:
      definition.resetBehavior as TrackerDefinitionView["resetBehavior"],
    category: definition.category,
    sortOrder: definition.sortOrder,
    isPinned: definition.isPinned,
    enabled: definition.enabled
  };
}

/*
 * A definition's scopeKey/key identity and its valueType/resetBehavior
 * are immutable after creation - changing what a tracker IS once real
 * history exists under it would silently corrupt that history's
 * meaning. Only display/visibility metadata (name, category, sortOrder,
 * isPinned, enabled) can be updated later.
 */
export class TrackerDefinitionService {
  constructor(
    private readonly repository:
      TrackerDefinitionRepositoryContract
  ) {}

  async listByScope(
    scopeKey: string
  ): Promise<TrackerDefinitionView[]> {
    const normalizedScope =
      normalizeTrackerScopeKey(scopeKey);

    const definitions =
      await this.repository.findByScope(
        normalizedScope
      );

    return definitions.map((definition) =>
      toView(definition)
    );
  }

  async create(
    input: TrackerDefinitionCreateInput
  ): Promise<TrackerDefinitionView> {
    const scopeKey =
      normalizeTrackerScopeKey(
        input.scopeKey
      );

    const key = normalizeTrackerKey(
      input.key
    );

    const existing =
      await this.repository.findByIdentity(
        scopeKey,
        key
      );

    if (existing) {
      throw new AppError(
        409,
        `A tracker with key "${key}" already exists in scope "${scopeKey}".`
      );
    }

    const created =
      await this.repository.create({
        ...input,
        scopeKey,
        key
      });

    return toView(created);
  }

  async updateMetadata(
    id: string,
    update: TrackerDefinitionMetadataUpdate
  ): Promise<TrackerDefinitionView> {
    await this.requireDefinition(id);

    const updated =
      await this.repository.updateMetadata(
        id,
        update
      );

    return toView(updated);
  }

  private async requireDefinition(
    id: string
  ) {
    const definition =
      await this.repository.findById(id);

    if (!definition) {
      throw new AppError(
        404,
        "Tracker definition not found."
      );
    }

    return definition;
  }
}
