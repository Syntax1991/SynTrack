import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { lootMemberLinkService } from "../../shared/member-link/member-link.instance.js";
import { LootWishlistController } from "./wishlist.controller.js";
import { LootWishlistRepository } from "./wishlist.repository.js";
import { LootWishlistService } from "./wishlist.service.js";

const repository =
  new LootWishlistRepository();

const service = new LootWishlistService(
  repository,
  lootMemberLinkService
);

const controller =
  new LootWishlistController(service);

export const lootWishlistRouter =
  Router();

lootWishlistRouter.get(
  "/me",
  asyncHandler(
    controller.getMyWishlist
  )
);

lootWishlistRouter.put(
  "/me/tier/:tierSlot",
  asyncHandler(
    controller.setTierStatus
  )
);

lootWishlistRouter.delete(
  "/me/tier/:tierSlot",
  asyncHandler(
    controller.clearTierStatus
  )
);

lootWishlistRouter.put(
  "/me/trinket/:rank",
  asyncHandler(
    controller.setTrinketChoice
  )
);

lootWishlistRouter.delete(
  "/me/trinket/:rank",
  asyncHandler(
    controller.clearTrinketChoice
  )
);
