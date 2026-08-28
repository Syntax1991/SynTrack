import type {
  TagAssignmentRow,
  TagRepositoryContract,
  TagRow
} from "./tag-repository.types.js";

/*
 * In-memory stand-in matching TagRepositoryContract, mirroring the
 * tracker module's fake-repository pattern (tracker.fakes.ts).
 */
export class FakeTagRepository
  implements TagRepositoryContract
{
  private readonly rows = new Map<
    string,
    TagRow
  >();

  private readonly assignments =
    new Set<string>();

  private readonly existingCharacterIds =
    new Set<string>();

  private nextId = 1;

  seedCharacter(characterId: string) {
    this.existingCharacterIds.add(
      characterId
    );
  }

  private assignmentKey(
    characterId: string,
    tagId: string
  ) {
    return `${characterId}:${tagId}`;
  }

  async findAll() {
    return [...this.rows.values()].sort(
      (left, right) =>
        left.sortOrder -
          right.sortOrder ||
        left.name.localeCompare(
          right.name
        )
    );
  }

  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }

  async create(input: {
    name: string;
    color?: string;
  }) {
    const id = `tag-${this.nextId++}`;
    const now = new Date();

    const row: TagRow = {
      id,
      name: input.name,
      color: input.color ?? null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now
    };

    this.rows.set(id, row);

    return row;
  }

  async update(
    id: string,
    update: {
      name?: string;
      color?: string | null;
      sortOrder?: number;
    }
  ) {
    const existing = this.rows.get(id);

    if (!existing) {
      throw new Error("tag not found");
    }

    const updated: TagRow = {
      ...existing,
      name:
        update.name ?? existing.name,
      color:
        update.color !== undefined
          ? update.color
          : existing.color,
      sortOrder:
        update.sortOrder ??
        existing.sortOrder,
      updatedAt: new Date()
    };

    this.rows.set(id, updated);

    return updated;
  }

  async delete(id: string) {
    this.rows.delete(id);

    for (const key of [
      ...this.assignments
    ]) {
      if (key.endsWith(`:${id}`)) {
        this.assignments.delete(key);
      }
    }
  }

  async assign(
    characterId: string,
    tagId: string
  ) {
    this.assignments.add(
      this.assignmentKey(
        characterId,
        tagId
      )
    );
  }

  async unassign(
    characterId: string,
    tagId: string
  ) {
    this.assignments.delete(
      this.assignmentKey(
        characterId,
        tagId
      )
    );
  }

  async findAllAssignments(): Promise<
    TagAssignmentRow[]
  > {
    return [...this.assignments].map(
      (key) => {
        const [
          characterId,
          tagId
        ] = key.split(":");

        return {
          characterId: characterId!,
          tagId: tagId!
        };
      }
    );
  }

  async findCharacterExists(
    characterId: string
  ) {
    return this.existingCharacterIds.has(
      characterId
    );
  }

  async findExistingCharacterIds(
    characterIds: string[]
  ) {
    return characterIds.filter((id) =>
      this.existingCharacterIds.has(id)
    );
  }

  async bulkAssign(
    characterIds: string[],
    addTagIds: string[],
    removeTagIds: string[]
  ) {
    for (const characterId of characterIds) {
      for (const tagId of addTagIds) {
        this.assignments.add(
          this.assignmentKey(
            characterId,
            tagId
          )
        );
      }

      for (const tagId of removeTagIds) {
        this.assignments.delete(
          this.assignmentKey(
            characterId,
            tagId
          )
        );
      }
    }
  }
}
