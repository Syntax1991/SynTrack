import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { raiderAuthService } from "../raider-auth/raider-auth.routes.js";
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
    deviceLinkService
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
