import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { SeasonChecklistController } from "./season-checklist.controller.js";
import { SeasonChecklistService } from "./season-checklist.service.js";

const service = new SeasonChecklistService();
const controller = new SeasonChecklistController(service);

export const seasonChecklistRouter = Router();

seasonChecklistRouter.get(
  "/",
  asyncHandler(controller.getChecklist)
);
