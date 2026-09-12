import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { lootMemberLinkService } from "../../shared/member-link/member-link.instance.js";
import { LootDroptimizerController } from "./droptimizer.controller.js";
import { LootDroptimizerRepository } from "./droptimizer.repository.js";
import { LootDroptimizerService } from "./droptimizer.service.js";
import { RaidbotsClient } from "./raidbots.client.js";

const repository =
  new LootDroptimizerRepository();

const raidbots = new RaidbotsClient();

const service = new LootDroptimizerService(
  repository,
  raidbots,
  lootMemberLinkService
);

const controller =
  new LootDroptimizerController(service);

export const lootDroptimizerRouter =
  Router();

lootDroptimizerRouter.get(
  "/me",
  asyncHandler(
    controller.getMyReport
  )
);

lootDroptimizerRouter.put(
  "/me",
  asyncHandler(
    controller.setMyReport
  )
);

lootDroptimizerRouter.delete(
  "/me",
  asyncHandler(
    controller.clearMyReport
  )
);
