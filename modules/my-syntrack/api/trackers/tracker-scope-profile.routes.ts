import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { TrackerScopeProfileController } from "./tracker-scope-profile.controller.js";
import { TrackerScopeProfileRepository } from "./tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "./tracker-scope-profile.service.js";

const repository =
  new TrackerScopeProfileRepository();

const service =
  new TrackerScopeProfileService(
    repository
  );

const controller =
  new TrackerScopeProfileController(
    service
  );

export const trackerScopeProfileRouter =
  Router();

trackerScopeProfileRouter.get(
  "/",
  asyncHandler(controller.list)
);

trackerScopeProfileRouter.get(
  "/active",
  asyncHandler(controller.getActive)
);

trackerScopeProfileRouter.post(
  "/",
  asyncHandler(controller.create)
);

trackerScopeProfileRouter.put(
  "/:key/activate",
  asyncHandler(controller.setActive)
);
