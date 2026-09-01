import type { RequestHandler } from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import type { SettingsTrustService } from "./settings-trust.service.js";

export class SettingsTrustController {
  constructor(
    private readonly service: SettingsTrustService
  ) {}

  getSnapshot: RequestHandler = async (
    request,
    response
  ) => {
    const token = requireBearerToken(request);

    response.json(
      await this.service.getSnapshot(token)
    );
  };
}
