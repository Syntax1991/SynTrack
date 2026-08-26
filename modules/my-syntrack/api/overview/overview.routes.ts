import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { OverviewController } from "./overview.controller.js";
import { OverviewService } from "./overview.service.js";

const service = new OverviewService();
const controller =
  new OverviewController(service);

export const overviewRouter = Router();

overviewRouter.get(
  "/",
  asyncHandler(
    controller.getOverview
  )
);
