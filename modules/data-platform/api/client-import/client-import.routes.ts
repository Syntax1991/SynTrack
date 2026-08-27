import express, {
  Router
} from "express";
import type { RequestHandler } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { deviceCredentialAuthService } from "../device-auth/device-link.routes.js";
import { AddonImportPersistence } from "../integrations/addon/addon-import.persistence.js";
import { AddonImportService } from "../integrations/addon/addon-import.service.js";
import { ClientImportController } from "./client-import.controller.js";
import { ClientImportService } from "./client-import.service.js";

const addonImportService =
  new AddonImportService(
    new AddonImportPersistence()
  );

const service = new ClientImportService(
  (source) =>
    addonImportService.importSavedVariables(
      source
    )
);

const controller =
  new ClientImportController(service);

/*
 * Deliberately not requireBearerToken (raider-auth/bearerToken.ts) -
 * that helper's error message is RaiderSession-specific. A device
 * credential is a distinct bearer secret and gets its own message.
 */
const requireDeviceCredential: RequestHandler =
  async (request, _response, next) => {
    try {
      const header =
        request.headers.authorization;

      const token = header?.startsWith(
        "Bearer "
      )
        ? header.slice(
            "Bearer ".length
          )
        : null;

      if (!token) {
        throw new AppError(
          401,
          "A device credential is required."
        );
      }

      await deviceCredentialAuthService.requireValidCredential(
        token
      );

      next();
    }
    catch (error) {
      next(error);
    }
  };

const rawSavedVariablesBody =
  express.text({
    type: "text/plain",
    limit: "25mb"
  });

export const clientImportRouter =
  Router();

clientImportRouter.post(
  "/import",
  asyncHandler(
    requireDeviceCredential
  ),
  rawSavedVariablesBody,
  asyncHandler(controller.import)
);
