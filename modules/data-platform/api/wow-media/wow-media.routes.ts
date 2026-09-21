import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetAppTokenService } from "../integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetMediaService } from "../integrations/battlenet/battlenet-media.service.js";
import { WowMediaController } from "./wow-media.controller.js";
import { WowMediaIconService } from "./wow-media-icon.service.js";

const iconService = new WowMediaIconService(
  new BattleNetMediaService(new BattleNetAppTokenService())
);

const controller = new WowMediaController(iconService);

export const wowMediaRouter = Router();

wowMediaRouter.get("/icons", asyncHandler(controller.getIcons));
