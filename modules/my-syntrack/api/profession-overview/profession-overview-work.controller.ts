import type { RequestHandler } from "express";
import { ProfessionOverviewWorkService } from "./profession-overview-work.service.js";

export class ProfessionOverviewWorkController {
  constructor(
    private readonly service =
      new ProfessionOverviewWorkService()
  ) {}

  getOverview: RequestHandler = async (
    _request,
    response
  ) => {
    response.json(
      await this.service.getOverview()
    );
  };
}
