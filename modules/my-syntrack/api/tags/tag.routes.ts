import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { TagController } from "./tag.controller.js";
import { TagRepository } from "./tag.repository.js";
import { TagService } from "./tag.service.js";

const repository = new TagRepository();
const service = new TagService(repository);
const controller = new TagController(
  service
);

export const tagRouter = Router();

tagRouter.get(
  "/",
  asyncHandler(controller.list)
);

tagRouter.post(
  "/",
  asyncHandler(controller.create)
);

tagRouter.put(
  "/:id",
  asyncHandler(controller.update)
);

tagRouter.delete(
  "/:id",
  asyncHandler(controller.delete)
);

tagRouter.get(
  "/assignments",
  asyncHandler(
    controller.listAssignments
  )
);

tagRouter.put(
  "/:tagId/characters/:characterId",
  asyncHandler(controller.assign)
);

tagRouter.delete(
  "/:tagId/characters/:characterId",
  asyncHandler(controller.unassign)
);
