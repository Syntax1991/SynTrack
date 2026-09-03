import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { SeasonGoalPreferenceController } from "./season-goal-preference.controller.js";
import { SeasonGoalPreferenceService } from "./season-goal-preference.service.js";

const service = new SeasonGoalPreferenceService();
const controller = new SeasonGoalPreferenceController(service);

export const seasonGoalPreferenceRouter = Router();

seasonGoalPreferenceRouter.get(
  "/",
  asyncHandler(controller.getManageGoalsView)
);

seasonGoalPreferenceRouter.put(
  "/",
  asyncHandler(controller.savePreference)
);

seasonGoalPreferenceRouter.delete(
  "/",
  asyncHandler(controller.resetPreference)
);
