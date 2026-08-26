import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { TrackerDefinitionRepository } from "./tracker-definition.repository.js";
import { TrackerValueController } from "./tracker-value.controller.js";
import { TrackerValueRepository } from "./tracker-value.repository.js";
import { TrackerValueService } from "./tracker-value.service.js";

const valueRepository =
  new TrackerValueRepository();

const definitionRepository =
  new TrackerDefinitionRepository();

const service = new TrackerValueService(
  valueRepository,
  definitionRepository
);

const controller =
  new TrackerValueController(service);

export const trackerValueRouter =
  Router();

trackerValueRouter.get(
  "/",
  asyncHandler(
    controller.getStatesForScope
  )
);

trackerValueRouter.put(
  "/:trackerDefinitionId/:characterId",
  asyncHandler(controller.setValue)
);

trackerValueRouter.delete(
  "/:trackerDefinitionId/:characterId",
  asyncHandler(controller.clearValue)
);
