import { env } from "../../../../apps/api/src/config/env.js";
import {
  generateBrowserToken,
  generateDeviceCode,
  hashSecret
} from "./device-auth.crypto.js";
import { sanitizeDeviceName } from "./device-name.js";
import type {
  DeviceLinkRepositoryContract,
  DeviceLinkRequestRow
} from "./device-link-repository.types.js";
import type {
  DeviceConnectionPreview,
  DeviceConnectionStartResult
} from "./device-auth.types.js";

const connectionLifetimeMilliseconds =
  10 * 60 * 1000;

export type AccountDisplayLookup = (
  raiderAccountId: string
) => Promise<{
  battleTag: string | null;
} | null>;

/*
 * The codeless "Continue with Battle.net" desktop connection flow - see
 * DeviceLinkService for the legacy human-typed-code flow it deliberately
 * shares repositories and the deviceCode/pollStatus polling mechanism
 * with (both flows are the same DeviceLinkRequest/DeviceCredential
 * shape, only START differs). Split into its own file purely to stay
 * under the repo's 350-line-per-file cap.
 *
 * Every public method here returns a DeviceConnectionPreview rather than
 * throwing for "no such request" / "already bound to someone else" - the
 * browser-facing contract is a closed set of distinct states
 * (PENDING/CONNECTED/EXPIRED/INVALID), and collapsing "doesn't exist" and
 * "belongs to a different account" into the same INVALID state is
 * intentional: a stranger probing a token must never be able to tell
 * those two cases apart.
 */
export class DeviceConnectionService {
  constructor(
    private readonly linkRepository: DeviceLinkRepositoryContract,
    private readonly getAccountDisplay: AccountDisplayLookup,
    private readonly requireRaiderSession: (
      token: string
    ) => Promise<{
      raiderAccountId: string;
    }>
  ) {}

  async createConnection(
    deviceName: string | null
  ): Promise<DeviceConnectionStartResult> {
    const browserToken =
      generateBrowserToken();

    const deviceCode =
      generateDeviceCode();

    const expiresAt = new Date(
      Date.now() +
        connectionLifetimeMilliseconds
    );

    await this.linkRepository.createConnection(
      {
        browserTokenHash: hashSecret(
          browserToken
        ),
        deviceCodeHash: hashSecret(
          deviceCode
        ),
        clientName:
          sanitizeDeviceName(
            deviceName
          ),
        expiresAt
      }
    );

    return {
      browserUrl:
        this.buildBrowserUrl(
          browserToken
        ),
      pollToken: deviceCode,
      expiresAt:
        expiresAt.toISOString()
    };
  }

  /*
   * Public/unauthenticated - the ClientConnectPage calls this before the
   * browser has necessarily authenticated at all, purely to decide what
   * to render. Never returns deviceCode, pollToken or the DeviceCredential.
   */
  async previewConnection(
    browserToken: string
  ): Promise<DeviceConnectionPreview> {
    const link =
      await this.linkRepository.findByBrowserTokenHash(
        hashSecret(browserToken)
      );

    if (!link) {
      return { status: "INVALID" };
    }

    return this.resolvePreview(link);
  }

  /*
   * The "browser already has a valid SynTrack session" fast path (spec
   * section 12) - binds without any Battle.net round trip. Re-verifies
   * the raider session server-side (same posture as
   * DeviceLinkService.approve) rather than trusting that the caller only
   * reached this because a UI gate passed.
   */
  async bindConnection(
    browserToken: string,
    raiderSessionToken: string
  ): Promise<DeviceConnectionPreview> {
    const session =
      await this.requireRaiderSession(
        raiderSessionToken
      );

    const link =
      await this.linkRepository.findByBrowserTokenHash(
        hashSecret(browserToken)
      );

    if (!link) {
      return { status: "INVALID" };
    }

    return this.attemptBind(
      link,
      session.raiderAccountId
    );
  }

  /*
   * Called only from the OAuth callback path (via
   * device-connection-bridge.ts), with the internal DeviceLinkRequest id
   * the callback already resolved and stored server-side on the OAuth
   * state / pending-registration row - never a client-resupplied
   * identifier.
   */
  async bindConnectionInternal(
    deviceLinkRequestId: string,
    raiderAccountId: string
  ): Promise<void> {
    const link =
      await this.linkRepository.findById(
        deviceLinkRequestId
      );

    if (!link) {
      return;
    }

    await this.attemptBind(
      link,
      raiderAccountId
    );
  }

  /*
   * Validates a raw browser capability without binding anything - used by
   * RaiderAuthController.connect to decide whether a deviceConnectionToken
   * query param is real before ever starting an OAuth round trip, and to
   * resolve it to the internal id that then travels through
   * BattleNetOAuthState/RaiderPendingRegistration instead of the raw
   * client-supplied value.
   */
  async resolvePendingByBrowserToken(
    browserToken: string
  ): Promise<{ id: string } | null> {
    const link =
      await this.linkRepository.findByBrowserTokenHash(
        hashSecret(browserToken)
      );

    if (
      !link ||
      link.status !== "PENDING" ||
      this.isExpiredRow(link)
    ) {
      return null;
    }

    return { id: link.id };
  }

  private isExpiredRow(
    link: DeviceLinkRequestRow
  ): boolean {
    return (
      link.expiresAt.getTime() <=
      Date.now()
    );
  }

  private async attemptBind(
    link: DeviceLinkRequestRow,
    raiderAccountId: string
  ): Promise<DeviceConnectionPreview> {
    if (link.status === "PENDING") {
      if (this.isExpiredRow(link)) {
        await this.linkRepository.markExpired(
          link.id
        );

        return {
          status: "EXPIRED"
        };
      }

      const updated =
        await this.linkRepository.markApproved(
          link.id,
          raiderAccountId
        );

      return this.resolvePreview(
        updated
      );
    }

    if (
      link.status === "APPROVED" ||
      link.status === "CONSUMED"
    ) {
      if (
        link.raiderAccountId !==
        raiderAccountId
      ) {
        console.warn(
          `[device-connect] rejected bind attempt for link=${link.id} - already bound to a different account`
        );

        return {
          status: "INVALID"
        };
      }

      return this.resolvePreview(
        link
      );
    }

    return { status: "EXPIRED" };
  }

  private async resolvePreview(
    link: DeviceLinkRequestRow
  ): Promise<DeviceConnectionPreview> {
    if (link.status === "PENDING") {
      if (this.isExpiredRow(link)) {
        return {
          status: "EXPIRED"
        };
      }

      return {
        status: "PENDING",
        deviceName: link.clientName
      };
    }

    if (
      link.status === "APPROVED" ||
      link.status === "CONSUMED"
    ) {
      const display =
        link.raiderAccountId
          ? await this.getAccountDisplay(
              link.raiderAccountId
            )
          : null;

      return {
        status: "CONNECTED",
        deviceName: link.clientName,
        connectedBattleTag:
          display?.battleTag ?? null
      };
    }

    return { status: "EXPIRED" };
  }

  private buildBrowserUrl(
    browserToken: string
  ): string {
    const target = new URL(
      "/client/connect",
      env.FRONTEND_ORIGIN
    );

    target.searchParams.set(
      "token",
      browserToken
    );

    return target.toString();
  }
}
