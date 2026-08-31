import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { raiderAuthService } from "../raider-auth/raider-auth.routes.js";
import {
  registerDeviceConnectionBinder,
  registerDeviceConnectionResolver
} from "./device-connection-bridge.js";
import { DeviceConnectionService } from "./device-connection.service.js";
import { DeviceCredentialAuthService } from "./device-credential-auth.service.js";
import { DeviceLinkController } from "./device-link.controller.js";
import {
  DeviceCredentialRepository,
  DeviceLinkRepository
} from "./device-link.repository.js";
import { DeviceLinkService } from "./device-link.service.js";

const linkRepository =
  new DeviceLinkRepository();

const credentialRepository =
  new DeviceCredentialRepository();

export const deviceLinkService =
  new DeviceLinkService(
    linkRepository,
    credentialRepository,
    (token) =>
      raiderAuthService.requireSession(
        token
      )
  );

export const deviceConnectionService =
  new DeviceConnectionService(
    linkRepository,
    (raiderAccountId) =>
      raiderAuthService.getAccountDisplay(
        raiderAccountId
      ),
    (token) =>
      raiderAuthService.requireSession(
        token
      )
  );

/*
 * Wires the two directions the OAuth callback (raider-auth) needs into
 * device-auth, without raider-auth ever importing device-auth directly -
 * see device-connection-bridge.ts for why. Safe to do unconditionally at
 * module load: apiRouter.ts imports both routers before the server ever
 * starts listening, so both registrations are always in place before any
 * request can be served.
 */
registerDeviceConnectionBinder(
  (deviceLinkRequestId, raiderAccountId) =>
    deviceConnectionService.bindConnectionInternal(
      deviceLinkRequestId,
      raiderAccountId
    )
);

registerDeviceConnectionResolver(
  (browserToken) =>
    deviceConnectionService.resolvePendingByBrowserToken(
      browserToken
    )
);

/*
 * Exported for the client-import transport route (a different module)
 * to reuse - the same credential repository backs both device-link
 * issuance/revocation and ongoing request authentication.
 */
export const deviceCredentialAuthService =
  new DeviceCredentialAuthService(
    credentialRepository
  );

const controller =
  new DeviceLinkController(
    deviceLinkService,
    deviceConnectionService
  );

export const deviceLinkRouter =
  Router();

deviceLinkRouter.post(
  "/link",
  asyncHandler(controller.create)
);

deviceLinkRouter.post(
  "/link/status",
  asyncHandler(controller.status)
);

deviceLinkRouter.post(
  "/link/:userCode/approve",
  asyncHandler(controller.approve)
);

deviceLinkRouter.get(
  "/devices",
  asyncHandler(
    controller.listDevices
  )
);

deviceLinkRouter.post(
  "/devices/:id/revoke",
  asyncHandler(
    controller.revokeDevice
  )
);

/*
 * Codeless connection flow - see device-connection.service.ts. Kept
 * under the same /client prefix as the legacy /link routes above (same
 * subsystem, same repositories).
 */
deviceLinkRouter.post(
  "/connect",
  asyncHandler(
    controller.startConnection
  )
);

deviceLinkRouter.post(
  "/connect/status",
  asyncHandler(
    controller.connectionStatus
  )
);

deviceLinkRouter.get(
  "/connect/preview",
  asyncHandler(
    controller.connectionPreview
  )
);

deviceLinkRouter.post(
  "/connect/bind",
  asyncHandler(
    controller.bindConnection
  )
);
