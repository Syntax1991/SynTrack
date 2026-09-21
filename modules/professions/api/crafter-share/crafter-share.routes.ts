import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";
import { CrafterShareController } from "./crafter-share.controller.js";
import { CrafterShareRepository } from "./crafter-share.repository.js";
import { CrafterShareService } from "./crafter-share.service.js";

const repository = new CrafterShareRepository();

const service = new CrafterShareService(repository);

const controller = new CrafterShareController(service, raiderAuthService);

export const crafterShareRouter = Router();

crafterShareRouter.get(
  "/",
  asyncHandler(controller.getStatus)
);

crafterShareRouter.post(
  "/enable",
  asyncHandler(controller.enable)
);

crafterShareRouter.post(
  "/disable",
  asyncHandler(controller.disable)
);

export const publicCrafterShareRouter = Router();

publicCrafterShareRouter.get(
  "/:token",
  asyncHandler(controller.getPublicCard)
);
