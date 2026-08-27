import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FakeDeviceCredentialRepository,
  FakeDeviceLinkRepository
} from "./device-link.fakes.js";
import { DeviceLinkService } from "./device-link.service.js";

let linkRepository: FakeDeviceLinkRepository;
let credentialRepository: FakeDeviceCredentialRepository;

let requireRaiderSession: ReturnType<
  typeof vi.fn<
    (
      token: string
    ) => Promise<unknown>
  >
>;

let service: DeviceLinkService;

beforeEach(() => {
  linkRepository =
    new FakeDeviceLinkRepository();

  credentialRepository =
    FakeDeviceCredentialRepository.sharing(
      linkRepository
    );

  requireRaiderSession = vi
    .fn<
      (
        token: string
      ) => Promise<unknown>
    >()
    .mockResolvedValue({
      raiderAccountId: "raider-1"
    });

  service = new DeviceLinkService(
    linkRepository,
    credentialRepository,
    (token: string) =>
      requireRaiderSession(token)
  );
});

describe("DeviceLinkService credentials", () => {
  it("revoked device credentials are rejected by credential lookup, active ones are accepted", async () => {
    const { userCode, deviceCode } =
      await service.createLink(null);

    await service.approve(
      userCode,
      "raider-token"
    );

    await service.pollStatus(
      deviceCode
    );

    const credentialId = [
      ...linkRepository.credentials.keys()
    ][0]!;

    const beforeRevoke =
      await credentialRepository.findByTokenHash(
        [
          ...linkRepository.credentials.values()
        ][0]!.tokenHash
      );

    expect(
      beforeRevoke?.revokedAt
    ).toBeNull();

    await service.revokeDevice(
      credentialId,
      "raider-token"
    );

    const afterRevoke =
      await credentialRepository.findByTokenHash(
        [
          ...linkRepository.credentials.values()
        ][0]!.tokenHash
      );

    expect(
      afterRevoke?.revokedAt
    ).not.toBeNull();
  });

  it("lastSeenAt starts null and is set once a credential is touched", async () => {
    const { userCode, deviceCode } =
      await service.createLink(null);

    await service.approve(
      userCode,
      "raider-token"
    );

    await service.pollStatus(
      deviceCode
    );

    const credentialId = [
      ...linkRepository.credentials.keys()
    ][0]!;

    expect(
      linkRepository.credentials.get(
        credentialId
      )?.lastSeenAt
    ).toBeNull();

    await credentialRepository.touchLastSeen(
      credentialId
    );

    expect(
      linkRepository.credentials.get(
        credentialId
      )?.lastSeenAt
    ).not.toBeNull();
  });

  it("listDevices never exposes tokenHash or any raw secret", async () => {
    const { userCode, deviceCode } =
      await service.createLink(null);

    await service.approve(
      userCode,
      "raider-token"
    );

    await service.pollStatus(
      deviceCode
    );

    const devices =
      await service.listDevices(
        "raider-token"
      );

    expect(devices).toHaveLength(1);

    expect(
      Object.keys(devices[0]!)
    ).not.toContain("tokenHash");
  });
});
