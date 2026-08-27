import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  DeviceCredentialRepositoryContract,
  DeviceCredentialRow,
  DeviceLinkRepositoryContract,
  DeviceLinkRequestRow
} from "./device-link-repository.types.js";

export class DeviceLinkRepository
  implements DeviceLinkRepositoryContract
{
  create(input: {
    userCode: string;
    deviceCodeHash: string;
    clientName: string | null;
    expiresAt: Date;
  }): Promise<DeviceLinkRequestRow> {
    return prisma.deviceLinkRequest.create(
      {
        data: {
          userCode: input.userCode,
          deviceCodeHash:
            input.deviceCodeHash,
          clientName:
            input.clientName,
          expiresAt: input.expiresAt
        }
      }
    );
  }

  findByUserCode(
    userCode: string
  ): Promise<DeviceLinkRequestRow | null> {
    return prisma.deviceLinkRequest.findUnique(
      { where: { userCode } }
    );
  }

  findByDeviceCodeHash(
    deviceCodeHash: string
  ): Promise<DeviceLinkRequestRow | null> {
    return prisma.deviceLinkRequest.findUnique(
      { where: { deviceCodeHash } }
    );
  }

  markApproved(
    id: string
  ): Promise<DeviceLinkRequestRow> {
    return prisma.deviceLinkRequest.update(
      {
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date()
        }
      }
    );
  }

  markExpired(
    id: string
  ): Promise<DeviceLinkRequestRow> {
    return prisma.deviceLinkRequest.update(
      {
        where: { id },
        data: { status: "EXPIRED" }
      }
    );
  }

  async consumeAndIssueCredential(
    linkRequestId: string,
    credential: {
      name: string;
      tokenHash: string;
    }
  ): Promise<DeviceCredentialRow> {
    const [, created] =
      await prisma.$transaction([
        prisma.deviceLinkRequest.update(
          {
            where: {
              id: linkRequestId
            },
            data: {
              status: "CONSUMED",
              consumedAt: new Date()
            }
          }
        ),
        prisma.deviceCredential.create(
          {
            data: {
              name: credential.name,
              tokenHash:
                credential.tokenHash,
              linkRequestId
            }
          }
        )
      ]);

    return created;
  }
}

export class DeviceCredentialRepository
  implements
    DeviceCredentialRepositoryContract
{
  findByTokenHash(
    tokenHash: string
  ): Promise<DeviceCredentialRow | null> {
    return prisma.deviceCredential.findUnique(
      { where: { tokenHash } }
    );
  }

  async touchLastSeen(
    id: string
  ): Promise<void> {
    await prisma.deviceCredential.update(
      {
        where: { id },
        data: {
          lastSeenAt: new Date()
        }
      }
    );
  }

  findAll(): Promise<
    DeviceCredentialRow[]
  > {
    return prisma.deviceCredential.findMany(
      {
        orderBy: {
          createdAt: "desc"
        }
      }
    );
  }

  revoke(
    id: string
  ): Promise<DeviceCredentialRow> {
    return prisma.deviceCredential.update(
      {
        where: { id },
        data: { revokedAt: new Date() }
      }
    );
  }
}
