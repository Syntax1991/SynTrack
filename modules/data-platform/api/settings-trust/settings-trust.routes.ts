import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { raiderAuthService } from "../raider-auth/raider-auth.routes.js";
import { SettingsTrustController } from "./settings-trust.controller.js";
import { SettingsTrustRepository } from "./settings-trust.repository.js";
import { SettingsTrustService } from "./settings-trust.service.js";

const repository =
  new SettingsTrustRepository();

const service =
  new SettingsTrustService(
    repository,
    raiderAuthService
  );

const controller =
  new SettingsTrustController(service);

export const settingsTrustRouter =
  Router();

settingsTrustRouter.get(
  "/trust",
  asyncHandler(
    controller.getSnapshot
  )
);
