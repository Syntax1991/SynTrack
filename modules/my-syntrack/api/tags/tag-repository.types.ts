/*
 * Plain-data contract the service depends on, rather than the concrete
 * Prisma-backed repository class - lets tests inject an in-memory fake
 * (tag.fakes.ts) the same way the tracker module already does.
 */
export type TagRow = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TagAssignmentRow = {
  characterId: string;
  tagId: string;
};

export interface TagRepositoryContract {
  findAll(): Promise<TagRow[]>;
  findById(id: string): Promise<TagRow | null>;
  create(input: {
    name: string;
    color?: string;
  }): Promise<TagRow>;
  update(
    id: string,
    update: {
      name?: string;
      color?: string | null;
      sortOrder?: number;
    }
  ): Promise<TagRow>;
  delete(id: string): Promise<void>;
  assign(
    characterId: string,
    tagId: string
  ): Promise<void>;
  unassign(
    characterId: string,
    tagId: string
  ): Promise<void>;
  findAllAssignments(): Promise<
    TagAssignmentRow[]
  >;
  findCharacterExists(
    characterId: string
  ): Promise<boolean>;
  findExistingCharacterIds(
    characterIds: string[]
  ): Promise<string[]>;
  bulkAssign(
    characterIds: string[],
    addTagIds: string[],
    removeTagIds: string[]
  ): Promise<void>;
}
