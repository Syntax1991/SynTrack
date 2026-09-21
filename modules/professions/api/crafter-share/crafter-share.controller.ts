import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import type { RaiderSessionGuard } from "../../../data-platform/api/raider-auth/raider-auth.types.js";
import { CrafterShareService } from "./crafter-share.service.js";

const publicTokenSchema = z
  .string()
  .regex(/^[a-f0-9]{32}$/u);

export class CrafterShareController {
  constructor(
    private readonly service: CrafterShareService,
    private readonly raiderAuth: RaiderSessionGuard
  ) {}

  getStatus: RequestHandler = async (request, response) => {
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);
    const status = await this.service.getStatus(session.raiderAccountId);

    response.json(status);
  };

  enable: RequestHandler = async (request, response) => {
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);
    const status = await this.service.enable(session.raiderAccountId);

    response.json(status);
  };

  disable: RequestHandler = async (request, response) => {
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);
    const status = await this.service.disable(session.raiderAccountId);

    response.json(status);
  };

  getPublicCard: RequestHandler = async (request, response) => {
    const parsed = publicTokenSchema.safeParse(request.params.token);

    if (!parsed.success) {
      throw new AppError(404, "This crafter card is not available.");
    }

    const card = await this.service.getPublicCard(parsed.data);

    response.json(card);
  };
}
