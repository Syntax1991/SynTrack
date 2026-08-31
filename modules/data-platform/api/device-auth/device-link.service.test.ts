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
    ) => Promise<{ raiderAccountId: string }>
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
      ) => Promise<{ raiderAccountId: string }>
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

describe("DeviceLinkService", () => {
  it("generates a separate userCode and deviceCode", async () => {
    const result =
      await service.createLink(null);

    expect(result.userCode).toMatch(
      /^[A-Z0-9]{4}-[A-Z0-9]{4}$/
    );

    expect(
      result.deviceCode.length
    ).toBeGreaterThanOrEqual(32);

    expect(result.userCode).not.toBe(
      result.deviceCode
    );
  });

  it("stores only the deviceCode hash, never the raw deviceCode", async () => {
    const { deviceCode } =
      await service.createLink(null);

    const stored = [
      ...linkRepository.links.values()
    ][0]!;

    expect(
      stored.deviceCodeHash
    ).not.toBe(deviceCode);

    expect(
      stored.deviceCodeHash
    ).toHaveLength(64);
  });

  it("status polling requires a valid deviceCode", async () => {
    const { deviceCode } =
      await service.createLink(null);

    await expect(
      service.pollStatus(deviceCode)
    ).resolves.toEqual({
      status: "PENDING"
    });
  });

  it("the short userCode cannot be used to poll status", async () => {
    const { userCode } =
      await service.createLink(null);

    await expect(
      service.pollStatus(userCode)
    ).rejects.toThrow(
      "Device link request not found."
    );
  });

  it("approval requires a valid RaiderSession server-side", async () => {
    const { userCode } =
      await service.createLink(null);

    await service.approve(
      userCode,
      "raider-token"
    );

    expect(
      requireRaiderSession
    ).toHaveBeenCalledWith(
      "raider-token"
    );
  });

  it("unauthenticated approval is rejected", async () => {
    requireRaiderSession.mockRejectedValue(
      new Error(
        "invalid raider session"
      )
    );

    const { userCode } =
      await service.createLink(null);

    await expect(
      service.approve(
        userCode,
        "bad-token"
      )
    ).rejects.toThrow(
      "invalid raider session"
    );

    const stored =
      await linkRepository.findByUserCode(
        userCode
      );

    expect(stored?.status).toBe(
      "PENDING"
    );
  });

  it("the first valid poll after APPROVED returns the raw DeviceCredential exactly once", async () => {
    const { userCode, deviceCode } =
      await service.createLink(null);

    await service.approve(
      userCode,
      "raider-token"
    );

    const result =
      await service.pollStatus(
        deviceCode
      );

    expect(result.status).toBe(
      "CONSUMED"
    );

    expect(
      "credential" in result &&
        result.credential
    ).toMatch(/^dvc_/);
  });

  it("the DB stores only DeviceCredential.tokenHash, never the raw credential", async () => {
    const { userCode, deviceCode } =
      await service.createLink(null);

    await service.approve(
      userCode,
      "raider-token"
    );

    const result =
      await service.pollStatus(
        deviceCode
      );

    const rawCredential =
      "credential" in result
        ? result.credential
        : undefined;

    const storedCredential = [
      ...linkRepository.credentials.values()
    ][0]!;

    expect(
      storedCredential.tokenHash
    ).not.toBe(rawCredential);

    expect(
      storedCredential.tokenHash
    ).toHaveLength(64);
  });

  it("a second poll cannot recover the secret", async () => {
    const { userCode, deviceCode } =
      await service.createLink(null);

    await service.approve(
      userCode,
      "raider-token"
    );

    await service.pollStatus(
      deviceCode
    );

    const secondPoll =
      await service.pollStatus(
        deviceCode
      );

    expect(secondPoll).toEqual({
      status: "CONSUMED"
    });

    expect(
      "credential" in secondPoll
    ).toBe(false);
  });

  it("an expired link cannot issue a credential", async () => {
    vi.useFakeTimers();

    try {
      const { userCode, deviceCode } =
        await service.createLink(
          null
        );

      await service.approve(
        userCode,
        "raider-token"
      );

      vi.advanceTimersByTime(
        11 * 60 * 1000
      );

      const result =
        await service.pollStatus(
          deviceCode
        );

      expect(result).toEqual({
        status: "EXPIRED"
      });
    }
    finally {
      vi.useRealTimers();
    }
  });
});
