import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";
import { LootMemberLinkRepository } from "./member-link.repository.js";
import { LootMemberLinkService } from "./member-link.service.js";

/*
 * Shared singleton for Wishlist and Droptimizer - there is no HTTP
 * route of its own (unlike the old guildRaiderLinkService export,
 * which doubled as an Express router composition point), since
 * nothing exposes this outside the two Loot services that consume it
 * directly.
 */
export const lootMemberLinkService =
  new LootMemberLinkService(
    new LootMemberLinkRepository(),
    raiderAuthService
  );
