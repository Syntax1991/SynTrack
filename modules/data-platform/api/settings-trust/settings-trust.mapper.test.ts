import { describe, expect, it } from "vitest";
import {
  buildSettingsTrustSnapshot,
  resolveBattleNetConnectionStatus
} from "./settings-trust.mapper.js";

describe("resolveBattleNetConnectionStatus", () => {
  it("returns not_linked when no canonical Blizzard account is stored", () => {
    expect(
      resolveBattleNetConnectionStatus({
        battleTag: "Syntax#21715",
        battleNetAccountId: null,
        accessToken: null,
        tokenExpiresAt: null
      })
    ).toBe("not_linked");
  });

  it("returns reconnect_required when the OAuth token is missing or expired", () => {
    expect(
      resolveBattleNetConnectionStatus({
        battleTag: "Syntax#21715",
        battleNetAccountId: "123",
        accessToken: null,
        tokenExpiresAt: null
      })
    ).toBe("reconnect_required");

    expect(
      resolveBattleNetConnectionStatus({
        battleTag: "Syntax#21715",
        battleNetAccountId: "123",
        accessToken: "token",
        tokenExpiresAt: new Date("2020-01-01")
      })
    ).toBe("reconnect_required");
  });

  it("returns linked when a usable Blizzard token is stored", () => {
    expect(
      resolveBattleNetConnectionStatus({
        battleTag: "Syntax#21715",
        battleNetAccountId: "123",
        accessToken: "token",
        tokenExpiresAt: new Date(
          Date.now() + 60_000
        )
      })
    ).toBe("linked");
  });
});

describe("buildSettingsTrustSnapshot", () => {
  it("uses desktop lastSeenAt as the account-level sync signal", () => {
    const lastSeenAt = new Date(
      "2026-09-01T13:44:30.000Z"
    );

    const snapshot =
      buildSettingsTrustSnapshot({
        account: {
          battleTag: "Syntax#21715",
          battleNetAccountId: "123",
          accessToken: "token",
          tokenExpiresAt: new Date(
            Date.now() + 60_000
          )
        },
        synTrackRosterCount: 22,
        desktopSync: {
          lastSeenAt,
          deviceCount: 1
        },
        coreDataReceived: true,
        professionDataReceived: true,
        discoveredCharacterCount: 24
      });

    expect(
      snapshot.wowSync.lastSuccessfulSyncAt
    ).toBe(lastSeenAt.toISOString());
    expect(snapshot.wowSync.source).toBe(
      "SynTrack Desktop"
    );
    expect(
      snapshot.battleNet.discoveredCharacterCount
    ).toBe(24);
  });

  it("does not claim a desktop source without registered devices", () => {
    const snapshot =
      buildSettingsTrustSnapshot({
        account: {
          battleTag: "Syntax#21715",
          battleNetAccountId: "123",
          accessToken: "token",
          tokenExpiresAt: new Date(
            Date.now() + 60_000
          )
        },
        synTrackRosterCount: 0,
        desktopSync: {
          lastSeenAt: null,
          deviceCount: 0
        },
        coreDataReceived: false,
        professionDataReceived: false,
        discoveredCharacterCount: 0
      });

    expect(snapshot.wowSync.source).toBeNull();
    expect(
      snapshot.wowSync.lastSuccessfulSyncAt
    ).toBeNull();
    expect(
      snapshot.wowSync.hasRegisteredDevice
    ).toBe(false);
  });
});
