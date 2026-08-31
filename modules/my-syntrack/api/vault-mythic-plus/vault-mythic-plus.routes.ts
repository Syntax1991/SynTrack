import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { VaultMythicPlusController } from "./vault-mythic-plus.controller.js";
import { VaultMythicPlusRepository } from "./vault-mythic-plus.repository.js";
import { VaultMythicPlusService } from "./vault-mythic-plus.service.js";

const repository = new VaultMythicPlusRepository();
const service = new VaultMythicPlusService(repository);
const controller = new VaultMythicPlusController(service);

export const vaultMythicPlusRouter = Router();

vaultMythicPlusRouter.get(
  "/",
  asyncHandler(controller.getOverview)
);
