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

describe("DeviceConnectionService", () => {
  it("createConnection generates a browserUrl and a pollToken as two independent high-entropy secrets", async () => {
    const result =
      await service.createConnection(
        "GAMING-PC"
      );

    const url = new URL(
      result.browserUrl
    );

    const browserToken =
      url.searchParams.get("token")!;

    expect(
      browserToken.length
    ).toBeGreaterThanOrEqual(32);

    expect(
      result.pollToken.length
    ).toBeGreaterThanOrEqual(32);

    expect(browserToken).not.toBe(
      result.pollToken
    );
  });

  it("stores only hashes, never the raw browserToken or pollToken", async () => {
    const result =
      await service.createConnection(
        null
      );

    const url = new URL(
      result.browserUrl
    );

    const browserToken =
      url.searchParams.get("token")!;

    const stored = [
      ...linkRepository.links.values()
    ][0]!;

    expect(
      stored.browserTokenHash
    ).not.toBe(browserToken);

    expect(
      stored.deviceCodeHash
    ).not.toBe(result.pollToken);

    expect(
      stored.browserTokenHash
    ).toHaveLength(64);
  });

  it("previewConnection never leaks pollToken/deviceCode - it is unauthenticated by design", async () => {
    const result =
      await service.createConnection(
        "GAMING-PC"
      );

    const url = new URL(
      result.browserUrl
    );

    const browserToken =
      url.searchParams.get("token")!;

    const preview =
      await service.previewConnection(
        browserToken
      );

    expect(preview).toEqual({
      status: "PENDING",
      deviceName: "GAMING-PC"
    });

    expect(
      JSON.stringify(preview)
    ).not.toContain(result.pollToken);
  });

  it("an unknown browserToken is reported as INVALID, not as an error", async () => {
    await expect(
      service.previewConnection(
        "does-not-exist"
      )
    ).resolves.toEqual({
      status: "INVALID"
    });
  });

  it("bindConnection re-verifies the raider session server-side before binding", async () => {
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

    expect(
      requireRaiderSession
    ).toHaveBeenCalledWith(
      "raider-session-token"
    );

    const stored = [
      ...linkRepository.links.values()
    ][0]!;

    expect(stored.status).toBe(
      "APPROVED"
    );

    expect(
      stored.raiderAccountId
    ).toBe("raider-1");
  });

  it("bindConnection is idempotent for the same account (browser refresh does not error or duplicate)", async () => {
    const { browserUrl } =
      await service.createConnection(
        null
      );

    const token = new URL(
      browserUrl
    ).searchParams.get("token")!;

    const first =
      await service.bindConnection(
        token,
        "raider-session-token"
      );

    const second =
      await service.bindConnection(
        token,
        "raider-session-token"
      );

    expect(first.status).toBe(
      "CONNECTED"
    );

    expect(second.status).toBe(
      "CONNECTED"
    );

    expect(
      linkRepository.links.size
    ).toBe(1);
  });
});
