import type {
  RequestHandler
} from "express";
import { OverviewService } from "./overview.service.js";

export class OverviewController {
  constructor(
    private readonly service:
      OverviewService
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
