import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { raiderAuthService } from "../raider-auth/raider-auth.routes.js";
import { RaiderAuthRepository } from "../raider-auth/raider-auth.repository.js";
import { AdminUsersController } from "./admin-users.controller.js";
import { AdminUsersRepository } from "./admin-users.repository.js";
import { AdminUsersService } from "./admin-users.service.js";

const controller = new AdminUsersController(
  new AdminUsersService(new AdminUsersRepository()),
  raiderAuthService,
  new RaiderAuthRepository()
);

export const adminUsersRouter = Router();

adminUsersRouter.get("/", asyncHandler(controller.list));
adminUsersRouter.post("/:id/approve", asyncHandler(controller.approve));
adminUsersRouter.post("/:id/disable", asyncHandler(controller.disable));
adminUsersRouter.post("/:id/enable", asyncHandler(controller.enable));
adminUsersRouter.post(
  "/:id/revoke-share",
  asyncHandler(controller.revokeShare)
);
adminUsersRouter.delete("/:id", asyncHandler(controller.remove));
