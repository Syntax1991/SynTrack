import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  TrackerScopeProfileRepositoryContract,
  TrackerScopeProfileRow
} from "./tracker-scope-profile-repository.types.js";

export class TrackerScopeProfileRepository
  implements
    TrackerScopeProfileRepositoryContract
{
  findAll(): Promise<
    TrackerScopeProfileRow[]
  > {
    return prisma.trackerScopeProfile.findMany(
      {
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "asc" }
        ]
      }
    );
  }

  findByKey(
    key: string
  ): Promise<TrackerScopeProfileRow | null> {
    return prisma.trackerScopeProfile.findUnique(
      { where: { key } }
    );
  }

  findActive(): Promise<TrackerScopeProfileRow | null> {
    return prisma.trackerScopeProfile.findFirst(
      { where: { isActive: true } }
    );
  }

  create(input: {
    key: string;
    name: string;
  }): Promise<TrackerScopeProfileRow> {
    return prisma.trackerScopeProfile.create(
      {
        data: {
          key: input.key,
          name: input.name
        }
      }
    );
  }

  async setActive(
    key: string
  ): Promise<TrackerScopeProfileRow> {
    const [, activated] =
      await prisma.$transaction([
        prisma.trackerScopeProfile.updateMany(
          {
            where: { isActive: true },
            data: { isActive: false }
          }
        ),
        prisma.trackerScopeProfile.update(
          {
            where: { key },
            data: { isActive: true }
          }
        )
      ]);

    return activated;
  }
}
