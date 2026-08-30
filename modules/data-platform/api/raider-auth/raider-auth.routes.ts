import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetClient } from "../integrations/battlenet/battlenet.client.js";
import { BattleNetRepository } from "../integrations/battlenet/battlenet.repository.js";
import { RaiderAuthController } from "./raider-auth.controller.js";
import { RaiderAuthRepository } from "./raider-auth.repository.js";
import { RaiderAuthService } from "./raider-auth.service.js";

const repository =
  new RaiderAuthRepository();

const battleNetRepository =
  new BattleNetRepository();

const battleNetClient =
  new BattleNetClient();

export const raiderAuthService =
  new RaiderAuthService(
    repository,
    battleNetRepository,
    battleNetClient
  );

const controller =
  new RaiderAuthController(
    raiderAuthService
  );

export const raiderAuthRouter =
  Router();

raiderAuthRouter.get(
  "/connect",
  asyncHandler(
    controller.connect
  )
);

raiderAuthRouter.get(
  "/callback",
  controller.callback
);

raiderAuthRouter.get(
  "/session",
  asyncHandler(
    controller.getSession
  )
);

raiderAuthRouter.post(
  "/logout",
  asyncHandler(
    controller.logout
  )
);

raiderAuthRouter.get(
  "/register/pending",
  asyncHandler(
    controller.getRegistrationPending
  )
);

raiderAuthRouter.post(
  "/register/confirm",
  asyncHandler(
    controller.confirmRegistration
  )
);
