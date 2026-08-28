import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  TagAssignmentRow,
  TagRepositoryContract,
  TagRow
} from "./tag-repository.types.js";

export class TagRepository
  implements TagRepositoryContract
{
  findAll(): Promise<TagRow[]> {
    return prisma.characterTag.findMany(
      {
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" }
        ]
      }
    );
  }

  findById(
    id: string
  ): Promise<TagRow | null> {
    return prisma.characterTag.findUnique(
      { where: { id } }
    );
  }

  create(input: {
    name: string;
    color?: string;
  }): Promise<TagRow> {
    return prisma.characterTag.create({
      data: {
        name: input.name,
        ...(input.color !== undefined
          ? { color: input.color }
          : {})
      }
    });
  }

  update(
    id: string,
    update: {
      name?: string;
      color?: string | null;
      sortOrder?: number;
    }
  ): Promise<TagRow> {
    return prisma.characterTag.update({
      where: { id },
      data: {
        ...(update.name !== undefined
          ? { name: update.name }
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
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.characterTag.delete({
      where: { id }
    });
  }

  async assign(
    characterId: string,
    tagId: string
  ): Promise<void> {
    await prisma.characterTagAssignment.upsert(
      {
        where: {
          characterId_tagId: {
            characterId,
            tagId
          }
        },
        create: {
          characterId,
          tagId
        },
        update: {}
      }
    );
  }

  async unassign(
    characterId: string,
    tagId: string
  ): Promise<void> {
    await prisma.characterTagAssignment.deleteMany(
      {
        where: {
          characterId,
          tagId
        }
      }
    );
  }

  findAllAssignments(): Promise<
    TagAssignmentRow[]
  > {
    return prisma.characterTagAssignment.findMany(
      {
        select: {
          characterId: true,
          tagId: true
        }
      }
    );
  }

  async findCharacterExists(
    characterId: string
  ): Promise<boolean> {
    const character =
      await prisma.character.findUnique(
        {
          where: { id: characterId },
          select: { id: true }
        }
      );

    return character !== null;
  }

  async findExistingCharacterIds(
    characterIds: string[]
  ): Promise<string[]> {
    const characters =
      await prisma.character.findMany({
        where: {
          id: { in: characterIds }
        },
        select: { id: true }
      });

    return characters.map(
      (character) => character.id
    );
  }

  /*
   * SQLite's Prisma client has no createMany skipDuplicates support
   * (that's a MySQL/Postgres-only feature), so re-adding an already-
   * assigned tag is made harmless the same way the existing single
   * assign() already does it - per-combination upsert. deleteMany on
   * the remove side is already a no-op for a missing assignment by
   * construction. Everything runs in one transaction so a bulk request
   * with both adds and removes never applies only half.
   */
  async bulkAssign(
    characterIds: string[],
    addTagIds: string[],
    removeTagIds: string[]
  ): Promise<void> {
    await prisma.$transaction([
      ...characterIds.flatMap(
        (characterId) =>
          addTagIds.map((tagId) =>
            prisma.characterTagAssignment.upsert(
              {
                where: {
                  characterId_tagId: {
                    characterId,
                    tagId
                  }
                },
                create: {
                  characterId,
                  tagId
                },
                update: {}
              }
            )
          )
      ),
      ...(removeTagIds.length > 0
        ? [
            prisma.characterTagAssignment.deleteMany(
              {
                where: {
                  characterId: {
                    in: characterIds
                  },
                  tagId: {
                    in: removeTagIds
                  }
                }
              }
            )
          ]
        : [])
    ]);
  }
}
