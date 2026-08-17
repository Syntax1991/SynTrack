import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { guildRaiderLinkService } from "../../../guild/api/raider-link/raider-link.routes.js";
import { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import { GuildTeamRepository } from "../../../guild/api/teams/team.repository.js";
import { guildVerificationService } from "../../../guild/api/verification/verification.routes.js";
import { RaidSetupController } from "./setup.controller.js";
import { RaidSetupRepository } from "./setup.repository.js";
import { RaidSetupService } from "./setup.service.js";

const repository = new RaidSetupRepository();

const rosterRepository = new GuildRosterRepository();

const teamRepository = new GuildTeamRepository();

export const raidSetupService = new RaidSetupService(
  repository,
  rosterRepository,
  teamRepository,
  guildVerificationService,
  guildRaiderLinkService
);

const controller = new RaidSetupController(
  raidSetupService
);

export const raidSetupRouter = Router();

raidSetupRouter.get(
  "/events/:eventId",
  asyncHandler(controller.getForEvent)
);

raidSetupRouter.get(
  "/events/:eventId/setups",
  asyncHandler(controller.listForEvent)
);

raidSetupRouter.post(
  "/events/:eventId/setups",
  asyncHandler(controller.createSetup)
);

raidSetupRouter.post(
  "/:setupId/members",
  asyncHandler(controller.addMembers)
);

raidSetupRouter.delete(
  "/:setupId/members/:memberId",
  asyncHandler(controller.removeMember)
);

raidSetupRouter.post(
  "/:setupId/update-roster",
  asyncHandler(controller.updateRosterFromTeam)
);
