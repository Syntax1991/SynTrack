import { Router } from "express";
import { asyncHandler } from "../../../apps/api/src/shared/http/asyncHandler.js";
import { ProfessionOverviewWorkController } from "../../my-syntrack/api/profession-overview/profession-overview-work.controller.js";
import { ProfessionController } from "./profession.controller.js";
import { ProfessionRepository } from "./profession.repository.js";
import { ProfessionService } from "./profession.service.js";

const repository =
  new ProfessionRepository();

const service =
  new ProfessionService(
    repository
  );

const controller =
  new ProfessionController(
    service
  );

const overviewWorkController =
  new ProfessionOverviewWorkController();

export const professionRouter =
  Router();

professionRouter.get(
  "/overview-work",
  asyncHandler(
    overviewWorkController.getOverview
  )
);

professionRouter.get(
  "/",
  asyncHandler(controller.list)
);