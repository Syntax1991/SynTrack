import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { normalizeTrackerScopeKey } from "./tracker-key.js";
import type {
  TrackerScopeProfileRepositoryContract,
  TrackerScopeProfileRow
} from "./tracker-scope-profile-repository.types.js";
import type {
  TrackerScopeProfileCreateInput,
  TrackerScopeProfileView
} from "./tracker-scope-profile.types.js";

function toView(
  row: TrackerScopeProfileRow
): TrackerScopeProfileView {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt.toISOString(),
    updatedAt:
      row.updatedAt.toISOString()
  };
}

/*
 * The one authoritative source for "which tracker scope is active" -
 * switching season only ever flips TrackerScopeProfile.isActive; it
 * never touches CharacterTrackerDefinition/CharacterTrackerValue, so
 * historical scopes and their values remain fully intact and readable.
 * key is immutable after creation and there is no delete here by
 * design (V1 does not expose destructive profile deletion).
 */
export class TrackerScopeProfileService {
  constructor(
    private readonly repository: TrackerScopeProfileRepositoryContract
  ) {}

  async list(): Promise<
    TrackerScopeProfileView[]
  > {
    const rows =
      await this.repository.findAll();

    return rows.map(toView);
  }

  async getActive(): Promise<TrackerScopeProfileView | null> {
    const row =
      await this.repository.findActive();

    return row ? toView(row) : null;
  }

  async create(
    input: TrackerScopeProfileCreateInput
  ): Promise<TrackerScopeProfileView> {
    const key =
      normalizeTrackerScopeKey(
        input.key
      );

    const name = input.name.trim();

    if (name.length === 0) {
      throw new AppError(
        400,
        "Scope profile name cannot be empty."
      );
    }

    const existing =
      await this.repository.findByKey(
        key
      );

    if (existing) {
      throw new AppError(
        409,
        `A tracker scope profile with key "${key}" already exists.`
      );
    }

    const created =
      await this.repository.create({
        key,
        name
      });

    return toView(created);
  }

  async setActive(
    key: string
  ): Promise<TrackerScopeProfileView> {
    const normalizedKey =
      normalizeTrackerScopeKey(key);

    const existing =
      await this.repository.findByKey(
        normalizedKey
      );

    if (!existing) {
      throw new AppError(
        404,
        "Tracker scope profile not found."
      );
    }

    const activated =
      await this.repository.setActive(
        normalizedKey
      );

    return toView(activated);
  }
}
