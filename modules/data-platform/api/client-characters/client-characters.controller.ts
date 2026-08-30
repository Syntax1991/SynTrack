import type { RequestHandler } from "express";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { ClientCharactersService } from "./client-characters.service.js";

/*
 * Same extraction/error-message pattern as client-import.routes.ts and
 * client-profile.controller.ts - deliberately not requireBearerToken,
 * which is RaiderSession-specific.
 */
function requireDeviceToken(
  request: Parameters<RequestHandler>[0]
): string {
  const header =
    request.headers.authorization;

  const token = header?.startsWith(
    "Bearer "
  )
    ? header.slice("Bearer ".length)
    : null;

  if (!token) {
    throw new AppError(
      401,
      "A device credential is required."
    );
  }

  return token;
}

export class ClientCharactersController {
  constructor(
    private readonly requireValidCredential: (
      rawToken: string
    ) => Promise<unknown>,
    private readonly service: ClientCharactersService
  ) {}

  list: RequestHandler = async (
    request,
    response
  ) => {
    const token = requireDeviceToken(
      request
    );

    // Any valid, non-revoked device credential may read the roster -
    // see ClientCharactersService for why there is no further
    // per-account filtering.
    await this.requireValidCredential(
      token
    );

    response.json({
      items: await this.service.list()
    });
  };
}
