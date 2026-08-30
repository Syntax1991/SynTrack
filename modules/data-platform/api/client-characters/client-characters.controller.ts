import type { RequestHandler } from "express";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { DeviceCredentialRow } from "../device-auth/device-link-repository.types.js";
import { ClientCharactersService } from "./client-characters.service.js";

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
    ) => Promise<DeviceCredentialRow>,
    private readonly service: ClientCharactersService
  ) {}

  list: RequestHandler = async (
    request,
    response
  ) => {
    const token = requireDeviceToken(
      request
    );

    const credential =
      await this.requireValidCredential(
        token
      );

    if (!credential.raiderAccountId) {
      throw new AppError(
        409,
        "Device credential has no linked SynTrack account. Reconnect with Battle.net."
      );
    }

    response.json({
      items:
        await this.service.listForAccount(
          credential.raiderAccountId
        )
    });
  };
}
