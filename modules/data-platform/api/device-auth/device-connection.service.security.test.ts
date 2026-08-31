import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { FakeDeviceLinkRepository } from "./device-link.fakes.js";
import { DeviceConnectionService } from "./device-connection.service.js";

let linkRepository: FakeDeviceLinkRepository;

let getAccountDisplay: ReturnType<
  typeof vi.fn<
    (
      raiderAccountId: string
    ) => Promise<{
      battleTag: string | null;
    } | null>
  >
>;

let requireRaiderSession: ReturnType<
  typeof vi.fn<
    (
      token: string
    ) => Promise<{
      raiderAccountId: string;
    }>
  >
>;

let service: DeviceConnectionService;

beforeEach(() => {
  linkRepository =
    new FakeDeviceLinkRepository();

  getAccountDisplay = vi
    .fn<
      (
        raiderAccountId: string
      ) => Promise<{
        battleTag: string | null;
      } | null>
    >()
    .mockResolvedValue({
      battleTag: "Syntax#21715"
    });

  requireRaiderSession = vi
    .fn<
      (
        token: string
      ) => Promise<{
        raiderAccountId: string;
      }>
    >()
    .mockResolvedValue({
      raiderAccountId: "raider-1"
    });

  service =
    new DeviceConnectionService(
      linkRepository,
      getAccountDisplay,
      (token: string) =>
        requireRaiderSession(token)
    );
});

describe("DeviceConnectionService — security & lifecycle", () => {
  it("a different account can never steal an already-bound connection request", async () => {
    const { browserUrl } =
      await service.createConnection(
        null
      );

    const token = new URL(
      browserUrl
    ).searchParams.get("token")!;

    await service.bindConnection(
      token,
      "raider-session-token"
    );

    requireRaiderSession.mockResolvedValueOnce(
      {
        raiderAccountId: "raider-2"
      }
    );

    const hijackAttempt =
      await service.bindConnection(
        token,
        "attacker-token"
      );

    expect(
      hijackAttempt.status
    ).toBe("INVALID");

    const stored = [
      ...linkRepository.links.values()
    ][0]!;

    // Still bound to the original account - never overwritten.
    expect(
      stored.raiderAccountId
    ).toBe("raider-1");
  });

  it("bindConnectionInternal (OAuth-callback path) never throws for a cross-account mismatch - it must not break an unrelated login", async () => {
    const { browserUrl } =
      await service.createConnection(
        null
      );

    const token = new URL(
      browserUrl
    ).searchParams.get("token")!;

    const link = [
      ...linkRepository.links.values()
    ][0]!;

    await service.bindConnectionInternal(
      link.id,
      "raider-1"
    );

    await expect(
      service.bindConnectionInternal(
        link.id,
        "raider-2"
      )
    ).resolves.toBeUndefined();

    const stored =
      linkRepository.links.get(
        link.id
      )!;

    expect(
      stored.raiderAccountId
    ).toBe("raider-1");
  });

  it("an expired connection request cannot be bound", async () => {
    vi.useFakeTimers();

    try {
      const { browserUrl } =
        await service.createConnection(
          null
        );

      const token = new URL(
        browserUrl
      ).searchParams.get("token")!;

      vi.advanceTimersByTime(
        11 * 60 * 1000
      );

      const result =
        await service.bindConnection(
          token,
          "raider-session-token"
        );

      expect(result).toEqual({
        status: "EXPIRED"
      });
    }
    finally {
      vi.useRealTimers();
    }
  });

  it("resolvePendingByBrowserToken only resolves a real, PENDING, unexpired request - the server-verified reference used to carry the connection through OAuth", async () => {
    const { browserUrl } =
      await service.createConnection(
        null
      );

    const token = new URL(
      browserUrl
    ).searchParams.get("token")!;

    const resolved =
      await service.resolvePendingByBrowserToken(
        token
      );

    expect(resolved).not.toBeNull();

    await expect(
      service.resolvePendingByBrowserToken(
        "unknown-token"
      )
    ).resolves.toBeNull();

    // Already-bound requests are no longer "pending" for a fresh OAuth
    // round trip to attach to.
    await service.bindConnection(
      token,
      "raider-session-token"
    );

    await expect(
      service.resolvePendingByBrowserToken(
        token
      )
    ).resolves.toBeNull();
  });

  it("a CONNECTED preview includes the connected account's display, resolved via the injected lookup - never a raw account id", async () => {
    const { browserUrl } =
      await service.createConnection(
        "GAMING-PC"
      );

    const token = new URL(
      browserUrl
    ).searchParams.get("token")!;

    await service.bindConnection(
      token,
      "raider-session-token"
    );

    const preview =
      await service.previewConnection(
        token
      );

    expect(preview).toEqual({
      status: "CONNECTED",
      deviceName: "GAMING-PC",
      connectedBattleTag:
        "Syntax#21715"
    });

    expect(
      getAccountDisplay
    ).toHaveBeenCalledWith(
      "raider-1"
    );
  });

  it("device name is sanitized: control characters are stripped before storage", async () => {
    const rawName =
      "GAMING" +
      String.fromCharCode(0) +
      "-PC" +
      String.fromCharCode(27) +
      "[31mEVIL";

    const result =
      await service.createConnection(
        rawName
      );

    const url = new URL(
      result.browserUrl
    );

    const preview =
      await service.previewConnection(
        url.searchParams.get(
          "token"
        )!
      );

    const storedName =
      "deviceName" in preview
        ? preview.deviceName
        : null;

    expect(storedName).not.toBeNull();

    for (
      let index = 0;
      index < storedName!.length;
      index++
    ) {
      expect(
        storedName!.charCodeAt(index)
      ).toBeGreaterThanOrEqual(32);
    }
  });
});
