import type {
  DeviceCredentialRepositoryContract,
  DeviceCredentialRow,
  DeviceLinkRepositoryContract,
  DeviceLinkRequestRow
} from "./device-link-repository.types.js";

export class FakeDeviceLinkRepository
  implements DeviceLinkRepositoryContract
{
  readonly links = new Map<
    string,
    DeviceLinkRequestRow
  >();

  readonly credentials = new Map<
    string,
    DeviceCredentialRow
  >();

  private nextId = 1;

  async create(input: {
    userCode: string;
    deviceCodeHash: string;
    clientName: string | null;
    expiresAt: Date;
  }) {
    const id = `link-${this.nextId++}`;
    const now = new Date();

    const row: DeviceLinkRequestRow = {
      id,
      userCode: input.userCode,
      deviceCodeHash:
        input.deviceCodeHash,
      status: "PENDING",
      clientName: input.clientName,
      expiresAt: input.expiresAt,
      approvedAt: null,
      consumedAt: null,
      createdAt: now
    };

    this.links.set(id, row);

    return row;
  }

  async findByUserCode(
    userCode: string
  ) {
    return (
      [...this.links.values()].find(
        (row) =>
          row.userCode === userCode
      ) ?? null
    );
  }

  async findByDeviceCodeHash(
    deviceCodeHash: string
  ) {
    return (
      [...this.links.values()].find(
        (row) =>
          row.deviceCodeHash ===
          deviceCodeHash
      ) ?? null
    );
  }

  async markApproved(id: string) {
    const existing =
      this.links.get(id);

    if (!existing) {
      throw new Error(
        "link not found"
      );
    }

    const updated: DeviceLinkRequestRow =
      {
        ...existing,
        status: "APPROVED",
        approvedAt: new Date()
      };

    this.links.set(id, updated);

    return updated;
  }

  async markExpired(id: string) {
    const existing =
      this.links.get(id);

    if (!existing) {
      throw new Error(
        "link not found"
      );
    }

    const updated: DeviceLinkRequestRow =
      {
        ...existing,
        status: "EXPIRED"
      };

    this.links.set(id, updated);

    return updated;
  }

  async consumeAndIssueCredential(
    linkRequestId: string,
    credential: {
      name: string;
      tokenHash: string;
    }
  ) {
    const existingLink =
      this.links.get(linkRequestId);

    if (!existingLink) {
      throw new Error(
        "link not found"
      );
    }

    this.links.set(linkRequestId, {
      ...existingLink,
      status: "CONSUMED",
      consumedAt: new Date()
    });

    const id = `cred-${this.nextId++}`;

    const row: DeviceCredentialRow = {
      id,
      name: credential.name,
      tokenHash: credential.tokenHash,
      linkRequestId,
      createdAt: new Date(),
      lastSeenAt: null,
      revokedAt: null
    };

    this.credentials.set(id, row);

    return row;
  }
}

export class FakeDeviceCredentialRepository
  implements
    DeviceCredentialRepositoryContract
{
  constructor(
    private readonly store = new Map<
      string,
      DeviceCredentialRow
    >()
  ) {}

  static sharing(
    linkRepository: FakeDeviceLinkRepository
  ): FakeDeviceCredentialRepository {
    return new FakeDeviceCredentialRepository(
      linkRepository.credentials
    );
  }

  seed(
    row: DeviceCredentialRow
  ): void {
    this.store.set(row.id, row);
  }

  async findByTokenHash(
    tokenHash: string
  ) {
    return (
      [
        ...this.store.values()
      ].find(
        (row) =>
          row.tokenHash === tokenHash
      ) ?? null
    );
  }

  async touchLastSeen(id: string) {
    const existing =
      this.store.get(id);

    if (existing) {
      this.store.set(id, {
        ...existing,
        lastSeenAt: new Date()
      });
    }
  }

  async findAll() {
    return [...this.store.values()];
  }

  async revoke(id: string) {
    const existing =
      this.store.get(id);

    if (!existing) {
      throw new Error(
        "credential not found"
      );
    }

    const updated: DeviceCredentialRow =
      {
        ...existing,
        revokedAt: new Date()
      };

    this.store.set(id, updated);

    return updated;
  }
}
