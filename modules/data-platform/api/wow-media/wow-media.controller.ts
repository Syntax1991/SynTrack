import type { RequestHandler } from "express";
import type { WowMediaIconService } from "./wow-media-icon.service.js";

export class WowMediaController {
  constructor(private readonly service: WowMediaIconService) {}

  getIcons: RequestHandler = async (_request, response) => {
    response.json(await this.service.getIcons());
  };
}
