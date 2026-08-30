import { beforeEach, describe, expect, it } from "vitest";
import { hashSecret } from "./device-auth.crypto.js";
import { DeviceCredentialAuthService } from "./device-credential-auth.service.js";
import { FakeDeviceCredentialRepository } from "./device-link.fakes.js";
import type { DeviceCredentialRow } from "./device-link-repository.types.js";

let repository: FakeDeviceCredentialRepository;
let service: DeviceCredentialAuthService;

function seed(
  repository: FakeDeviceCredentialRepository,
  overrides: Partial<DeviceCredentialRow> = {}
): { row: DeviceCredentialRow; rawToken: string } {
  const rawToken = "dvc_test-secret";
  const tokenHash = hashSecret(rawToken);

  const row: DeviceCredentialRow = {
    id: "cred-1",
    name: "Test Client",
    tokenHash,
    linkRequestId: null,
    raiderAccountId: null,
    createdAt: new Date(),
    lastSeenAt: null,
    revokedAt: null,
    ...overrides
  };

  repository.seed(row);

  return { row, rawToken };
}

beforeEach(() => {
  repository =
    new FakeDeviceCredentialRepository();

  service =
    new DeviceCredentialAuthService(
      repository
    );
});

describe("DeviceCredentialAuthService", () => {
  it("accepts a valid, non-revoked credential and updates lastSeenAt", async () => {
    const { rawToken } = seed(
      repository
    );

    const credential =
      await service.requireValidCredential(
        rawToken
      );

    expect(credential.id).toBe(
      "cred-1"
    );

    const stored =
      await repository.findByTokenHash(
        hashSecret(rawToken)
      );

    expect(
      stored?.lastSeenAt
    ).not.toBeNull();
  });

  it("rejects an unknown credential", async () => {
    await expect(
      service.requireValidCredential(
        "dvc_never-issued"
      )
    ).rejects.toThrow(
      "Invalid device credential."
    );
  });

  it("rejects a revoked credential", async () => {
    const { rawToken } = seed(
      repository,
      { revokedAt: new Date() }
    );

    await expect(
      service.requireValidCredential(
        rawToken
      )
    ).rejects.toThrow(
      "This device has been disconnected."
    );
  });
});
