import type { RequestHandler } from "express";
import { VaultMythicPlusService } from "./vault-mythic-plus.service.js";

export class VaultMythicPlusController {
  constructor(private readonly service: VaultMythicPlusService) {}

  getOverview: RequestHandler = async (_request, response) => {
    response.json(await this.service.getOverview());
  };
}
