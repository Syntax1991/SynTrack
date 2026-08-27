import type {
  TrackerScopeProfileRepositoryContract,
  TrackerScopeProfileRow
} from "./tracker-scope-profile-repository.types.js";

export class FakeTrackerScopeProfileRepository
  implements
    TrackerScopeProfileRepositoryContract
{
  private readonly rows = new Map<
    string,
    TrackerScopeProfileRow
  >();

  private nextId = 1;

  seed(
    row: Partial<TrackerScopeProfileRow> & {
      key: string;
      name: string;
    }
  ) {
    const now = new Date();

    const id =
      row.id ??
      `scope-${this.nextId++}`;

    this.rows.set(id, {
      id,
      key: row.key,
      name: row.name,
      isActive: row.isActive ?? false,
      sortOrder: row.sortOrder ?? 0,
      createdAt:
        row.createdAt ?? now,
      updatedAt:
        row.updatedAt ?? now
    });
  }

  async findAll() {
    return [...this.rows.values()].sort(
      (left, right) =>
        left.sortOrder -
          right.sortOrder ||
        left.createdAt.getTime() -
          right.createdAt.getTime()
    );
  }

  async findByKey(key: string) {
    return (
      [...this.rows.values()].find(
        (row) => row.key === key
      ) ?? null
    );
  }

  async findActive() {
    return (
      [...this.rows.values()].find(
        (row) => row.isActive
      ) ?? null
    );
  }

  async create(input: {
    key: string;
    name: string;
  }) {
    const id = `scope-${this.nextId++}`;
    const now = new Date();

    const row: TrackerScopeProfileRow =
      {
        id,
        key: input.key,
        name: input.name,
        isActive: false,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now
      };

    this.rows.set(id, row);

    return row;
  }

  async setActive(key: string) {
    for (const row of this.rows.values()) {
      row.isActive = false;
    }

    const target = [
      ...this.rows.values()
    ].find((row) => row.key === key);

    if (!target) {
      throw new Error(
        "scope profile not found"
      );
    }

    target.isActive = true;
    target.updatedAt = new Date();

    return target;
  }
}
