import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { TrackerDefinitionController } from "./tracker-definition.controller.js";
import { TrackerDefinitionRepository } from "./tracker-definition.repository.js";
import { TrackerDefinitionService } from "./tracker-definition.service.js";

const repository =
  new TrackerDefinitionRepository();

const service =
  new TrackerDefinitionService(
    repository
  );

const controller =
  new TrackerDefinitionController(
    service
  );

export const trackerDefinitionRouter =
  Router();

trackerDefinitionRouter.get(
  "/:scopeKey",
  asyncHandler(
    controller.listByScope
  )
);

trackerDefinitionRouter.post(
  "/",
  asyncHandler(controller.create)
);

trackerDefinitionRouter.put(
  "/:id",
  asyncHandler(
    controller.updateMetadata
  )
);
