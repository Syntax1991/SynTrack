import type { RequestHandler } from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { DeviceLinkService } from "./device-link.service.js";
import {
  deviceCredentialIdParamSchema,
  deviceLinkCreateSchema,
  deviceLinkStatusSchema,
  deviceLinkUserCodeParamSchema
} from "./device-link.validation.js";

export class DeviceLinkController {
  constructor(
    private readonly service: DeviceLinkService
  ) {}

  create: RequestHandler = async (
    request,
    response
  ) => {
    const input =
      deviceLinkCreateSchema.parse(
        request.body
      );

    response.json(
      await this.service.createLink(
        input.clientName ?? null
      )
    );
  };

  approve: RequestHandler = async (
    request,
    response
  ) => {
    const userCode =
      deviceLinkUserCodeParamSchema.parse(
        request.params.userCode
      );

    const raiderSessionToken =
      requireBearerToken(request);

    await this.service.approve(
      userCode,
      raiderSessionToken
    );

    response.json({ approved: true });
  };

  status: RequestHandler = async (
    request,
    response
  ) => {
    const input =
      deviceLinkStatusSchema.parse(
        request.body
      );

    response.json(
      await this.service.pollStatus(
        input.deviceCode
      )
    );
  };

  listDevices: RequestHandler = async (
    request,
    response
  ) => {
    const raiderSessionToken =
      requireBearerToken(request);

    response.json({
      items:
        await this.service.listDevices(
          raiderSessionToken
        )
    });
  };

  revokeDevice: RequestHandler = async (
    request,
    response
  ) => {
    const id =
      deviceCredentialIdParamSchema.parse(
        request.params.id
      );

    const raiderSessionToken =
      requireBearerToken(request);

    response.json(
      await this.service.revokeDevice(
        id,
        raiderSessionToken
      )
    );
  };
}
