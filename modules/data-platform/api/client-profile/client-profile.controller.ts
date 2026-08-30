import type { RequestHandler } from "express";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { ClientProfileService } from "./client-profile.service.js";

/*
 * Deliberately not requireBearerToken (raider-auth/bearerToken.ts) -
 * that helper's error message is RaiderSession-specific. Mirrors the
 * device-credential extraction in client-import.routes.ts.
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

export class ClientProfileController {
  constructor(
    private readonly service: ClientProfileService
  ) {}

  me: RequestHandler = async (
    request,
    response
  ) => {
    const token = requireDeviceToken(
      request
    );

    response.json(
      await this.service.getProfileForDeviceToken(
        token
      )
    );
  };
}
