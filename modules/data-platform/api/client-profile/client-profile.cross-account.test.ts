import { describe, expect, it, vi } from "vitest";
import { hashSecret } from "../device-auth/device-auth.crypto.js";
import { DeviceCredentialAuthService } from "../device-auth/device-credential-auth.service.js";
import { DeviceLinkService } from "../device-auth/device-link.service.js";
import {
  FakeDeviceCredentialRepository,
  FakeDeviceLinkRepository
} from "../device-auth/device-link.fakes.js";
import { ClientProfileService } from "./client-profile.service.js";

/*
 * End-to-end through the real DeviceLinkService + DeviceCredentialAuthService
 * + ClientProfileService (only the RaiderSession check and the
 * RaiderAccount->battleTag lookup are faked) - proves the full chain from
 * "an authenticated browser session approves a device" to "that device's
 * GET /api/client/me resolves exactly that account's BattleTag, live, and
 * never another account's" that duplicating battleTag onto DeviceCredential
 * would have made easy to get wrong.
 */
describe("Device identity is isolated per RaiderAccount end-to-end", () => {
  it("each device credential resolves only the BattleTag of the RaiderAccount whose session approved it", async () => {
    const linkRepository =
      new FakeDeviceLinkRepository();

    const credentialRepository =
      FakeDeviceCredentialRepository.sharing(
        linkRepository
      );

    const raiderAccountBattleTags =
      new Map<string, string | null>([
        ["raider-a", "Syntax#21715"],
        ["raider-b", "Otherplayer#1234"]
      ]);

    const requireRaiderSession = vi.fn(
      async (token: string) => {
        if (token === "session-a") {
          return {
            raiderAccountId: "raider-a"
          };
        }

        if (token === "session-b") {
          return {
            raiderAccountId: "raider-b"
          };
        }

        throw new Error(
          "invalid raider session"
        );
      }
    );

    const deviceLinkService =
      new DeviceLinkService(
        linkRepository,
        credentialRepository,
        requireRaiderSession
      );

    const deviceCredentialAuth =
      new DeviceCredentialAuthService(
        credentialRepository
      );

    const profileService =
      new ClientProfileService(
        (rawToken) =>
          deviceCredentialAuth.requireValidCredential(
            rawToken
          ),
        async (raiderAccountId) =>
          raiderAccountBattleTags.get(
            raiderAccountId
          ) ?? null
      );

    const linkA =
      await deviceLinkService.createLink(
        "Device A"
      );

    await deviceLinkService.approve(
      linkA.userCode,
      "session-a"
    );

    const resultA =
      await deviceLinkService.pollStatus(
        linkA.deviceCode
      );

    const linkB =
      await deviceLinkService.createLink(
        "Device B"
      );

    await deviceLinkService.approve(
      linkB.userCode,
      "session-b"
    );

    const resultB =
      await deviceLinkService.pollStatus(
        linkB.deviceCode
      );

    const credentialA =
      "credential" in resultA
        ? resultA.credential!
        : "";

    const credentialB =
      "credential" in resultB
        ? resultB.credential!
        : "";

    expect(credentialA).not.toBe("");
    expect(credentialB).not.toBe("");

    const profileA =
      await profileService.getProfileForDeviceToken(
        credentialA
      );

    const profileB =
      await profileService.getProfileForDeviceToken(
        credentialB
      );

    expect(profileA).toEqual({
      battleTag: "Syntax#21715"
    });

    expect(profileB).toEqual({
      battleTag: "Otherplayer#1234"
    });

    // The point of this whole test: device A's credential must never be
    // able to resolve device B's account's identity, or vice versa.
    expect(
      await profileService.getProfileForDeviceToken(
        credentialA
      )
    ).not.toEqual(profileB);
  });

  it("a device credential that predates raiderAccountId returns battleTag: null instead of guessing an owner", async () => {
    const credentialRepository =
      new FakeDeviceCredentialRepository();

    const rawToken = "dvc_legacy-client";

    credentialRepository.seed({
      id: "legacy-cred",
      name: "Legacy Client",
      tokenHash: hashSecret(rawToken),
      linkRequestId: null,
      raiderAccountId: null,
      createdAt: new Date(),
      lastSeenAt: null,
      revokedAt: null
    });

    const deviceCredentialAuth =
      new DeviceCredentialAuthService(
        credentialRepository
      );

    const findBattleTagByAccountId =
      vi.fn();

    const profileService =
      new ClientProfileService(
        (token) =>
          deviceCredentialAuth.requireValidCredential(
            token
          ),
        findBattleTagByAccountId
      );

    const profile =
      await profileService.getProfileForDeviceToken(
        rawToken
      );

    expect(profile).toEqual({
      battleTag: null
    });

    // No account id to look up with, so the RaiderAccount lookup must
    // never even be attempted (no guessing an owner).
    expect(
      findBattleTagByAccountId
    ).not.toHaveBeenCalled();
  });

  it("a revoked device credential cannot resolve any account's identity", async () => {
    const credentialRepository =
      new FakeDeviceCredentialRepository();

    const rawToken = "dvc_revoked-client";

    credentialRepository.seed({
      id: "revoked-cred",
      name: "Revoked Client",
      tokenHash: hashSecret(rawToken),
      linkRequestId: null,
      raiderAccountId: "raider-a",
      createdAt: new Date(),
      lastSeenAt: null,
      revokedAt: new Date()
    });

    const deviceCredentialAuth =
      new DeviceCredentialAuthService(
        credentialRepository
      );

    const profileService =
      new ClientProfileService(
        (token) =>
          deviceCredentialAuth.requireValidCredential(
            token
          ),
        async () => "Syntax#21715"
      );

    await expect(
      profileService.getProfileForDeviceToken(
        rawToken
      )
    ).rejects.toThrow(
      "This device has been disconnected."
    );
  });
});
