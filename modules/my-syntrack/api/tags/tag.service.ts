import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import {
  normalizeTagName,
  normalizeTagNameForComparison
} from "./tag-name.js";
import type {
  TagRepositoryContract,
  TagRow
} from "./tag-repository.types.js";
import type {
  TagAssignment,
  TagBulkAssignInput,
  TagCreateInput,
  TagUpdateInput,
  TagView
} from "./tag.types.js";

function toView(tag: TagRow): TagView {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    sortOrder: tag.sortOrder,
    createdAt:
      tag.createdAt.toISOString(),
    updatedAt:
      tag.updatedAt.toISOString()
  };
}

/*
 * Character Tags are lightweight personal organization, not a second
 * source of truth about characters - this service only ever creates/
 * renames/deletes tag rows and toggles CharacterTagAssignment rows. It
 * never touches Character itself.
 */
export class TagService {
  constructor(
    private readonly repository: TagRepositoryContract
  ) {}

  async list(): Promise<TagView[]> {
    const tags =
      await this.repository.findAll();

    return tags.map(toView);
  }

  async create(
    input: TagCreateInput
  ): Promise<TagView> {
    const name = normalizeTagName(
      input.name
    );

    if (name.length === 0) {
      throw new AppError(
        400,
        "Tag name cannot be empty."
      );
    }

    await this.assertNameAvailable(name);

    const created =
      await this.repository.create({
        name,
        ...(input.color !== undefined
          ? { color: input.color }
          : {})
      });

    return toView(created);
  }

  async update(
    id: string,
    update: TagUpdateInput
  ): Promise<TagView> {
    await this.requireTag(id);

    const normalizedName =
      update.name !== undefined
        ? normalizeTagName(update.name)
        : undefined;

    if (
      normalizedName !== undefined &&
      normalizedName.length === 0
    ) {
      throw new AppError(
        400,
        "Tag name cannot be empty."
      );
    }

    if (normalizedName !== undefined) {
      await this.assertNameAvailable(
        normalizedName,
        id
      );
    }

    /*
     * Renaming only ever touches CharacterTag.name - assignments are
     * keyed by tagId, which never changes here, so every existing
     * CharacterTagAssignment survives a rename untouched.
     */
    const updated =
      await this.repository.update(id, {
        ...(normalizedName !== undefined
          ? { name: normalizedName }
          : {}),
        ...(update.color !== undefined
          ? { color: update.color }
          : {}),
        ...(update.sortOrder !==
        undefined
          ? {
              sortOrder:
                update.sortOrder
            }
          : {})
      });

    return toView(updated);
  }

  async delete(id: string): Promise<void> {
    await this.requireTag(id);

    /*
     * onDelete: Cascade on CharacterTagAssignment.tagId removes only
     * this tag's assignment rows - Character rows are never touched.
     */
    await this.repository.delete(id);
  }

  async assign(
    characterId: string,
    tagId: string
  ): Promise<void> {
    await this.requireTag(tagId);
    await this.requireCharacter(
      characterId
    );

    await this.repository.assign(
      characterId,
      tagId
    );
  }

  async unassign(
    characterId: string,
    tagId: string
  ): Promise<void> {
    await this.repository.unassign(
      characterId,
      tagId
    );
  }

  async listAllAssignments(): Promise<
    TagAssignment[]
  > {
    return this.repository.findAllAssignments();
  }

  /*
   * A snapshot-style bulk edit, not an event stream: addTagIds and
   * removeTagIds are applied to every selected character in one
   * transaction (see the repository). Re-adding an already-assigned
   * tag or removing one that was never assigned is harmless by design
   * (matches the existing single assign/unassign semantics) - only a
   * genuinely ambiguous request (the same tag in both lists, or no
   * characters/no tags at all) is rejected.
   */
  async bulkAssign(
    input: TagBulkAssignInput
  ): Promise<void> {
    const characterIds = [
      ...new Set(input.characterIds)
    ];

    const addTagIds = [
      ...new Set(input.addTagIds)
    ];

    const removeTagIds = [
      ...new Set(input.removeTagIds)
    ];

    if (characterIds.length === 0) {
      throw new AppError(
        400,
        "At least one character must be selected."
      );
    }

    if (
      addTagIds.length === 0 &&
      removeTagIds.length === 0
    ) {
      throw new AppError(
        400,
        "At least one tag to add or remove must be provided."
      );
    }

    const conflictingTagIds =
      addTagIds.filter((tagId) =>
        removeTagIds.includes(tagId)
      );

    if (conflictingTagIds.length > 0) {
      throw new AppError(
        400,
        `A tag cannot be both added and removed in the same request: ${conflictingTagIds.join(", ")}.`
      );
    }

    const existingCharacterIds =
      new Set(
        await this.repository.findExistingCharacterIds(
          characterIds
        )
      );

    const missingCharacterIds =
      characterIds.filter(
        (characterId) =>
          !existingCharacterIds.has(
            characterId
          )
      );

    if (missingCharacterIds.length > 0) {
      throw new AppError(
        404,
        `Characters not found: ${missingCharacterIds.join(", ")}.`
      );
    }

    const allTagIds = [
      ...new Set([
        ...addTagIds,
        ...removeTagIds
      ])
    ];

    const existingTags =
      await this.repository.findAll();

    const existingTagIds = new Set(
      existingTags.map((tag) => tag.id)
    );

    const missingTagIds = allTagIds.filter(
      (tagId) =>
        !existingTagIds.has(tagId)
    );

    if (missingTagIds.length > 0) {
      throw new AppError(
        404,
        `Tags not found: ${missingTagIds.join(", ")}.`
      );
    }

    await this.repository.bulkAssign(
      characterIds,
      addTagIds,
      removeTagIds
    );
  }

  private async assertNameAvailable(
    name: string,
    excludeId?: string
  ) {
    const normalizedTarget =
      normalizeTagNameForComparison(
        name
      );

    const existingTags =
      await this.repository.findAll();

    const collision = existingTags.find(
      (tag) =>
        tag.id !== excludeId &&
        normalizeTagNameForComparison(
          tag.name
        ) === normalizedTarget
    );

    if (collision) {
      throw new AppError(
        409,
        `A tag named "${name}" already exists.`
      );
    }
  }

  private async requireTag(id: string) {
    const tag =
      await this.repository.findById(
        id
      );

    if (!tag) {
      throw new AppError(
        404,
        "Tag not found."
      );
    }

    return tag;
  }

  private async requireCharacter(
    characterId: string
  ) {
    const exists =
      await this.repository.findCharacterExists(
        characterId
      );

    if (!exists) {
      throw new AppError(
        404,
        "Character not found."
      );
    }
  }
}
