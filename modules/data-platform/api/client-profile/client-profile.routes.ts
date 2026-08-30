import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { deviceCredentialAuthService } from "../device-auth/device-link.routes.js";
import { ClientProfileController } from "./client-profile.controller.js";
import { ClientProfileRepository } from "./client-profile.repository.js";
import { ClientProfileService } from "./client-profile.service.js";

const repository =
  new ClientProfileRepository();

const service = new ClientProfileService(
  (rawToken) =>
    deviceCredentialAuthService.requireValidCredential(
      rawToken
    ),
  (raiderAccountId) =>
    repository.findBattleTagByAccountId(
      raiderAccountId
    )
);

const controller =
  new ClientProfileController(service);

export const clientProfileRouter =
  Router();

clientProfileRouter.get(
  "/me",
  asyncHandler(controller.me)
);
