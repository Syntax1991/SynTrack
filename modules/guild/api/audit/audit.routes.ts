import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";
import { guildVerificationService } from "../verification/verification.routes.js";
import { GuildAuditController } from "./audit.controller.js";
import { GuildAuditRepository } from "./audit.repository.js";
import { GuildAuditService } from "./audit.service.js";

const repository =
  new GuildAuditRepository();

const battleNetClient =
  new BattleNetClient();

const appTokenService =
  new BattleNetAppTokenService();

const service =
  new GuildAuditService(
    repository,
    battleNetClient,
    guildVerificationService,
    raiderAuthService,
    appTokenService
  );

const controller =
  new GuildAuditController(
    service
  );

export const guildAuditRouter =
  Router();

guildAuditRouter.post(
  "/refresh",
  asyncHandler(
    controller.refreshAll
  )
);

guildAuditRouter.get(
  "/gear-slots",
  asyncHandler(
    controller.listGearSlots
  )
);
