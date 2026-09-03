import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { OverviewController } from "./overview.controller.js";

const controller = new OverviewController();

export const overviewRouter = Router();

overviewRouter.get(
  "/",
  asyncHandler(controller.getOverview)
);

overviewRouter.get(
  "/characters/:characterId",
  asyncHandler(controller.getCharacterState)
);
