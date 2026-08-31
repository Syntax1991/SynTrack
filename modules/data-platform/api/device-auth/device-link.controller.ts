import type { RequestHandler } from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import type { DeviceConnectionService } from "./device-connection.service.js";
import { DeviceLinkService } from "./device-link.service.js";
import {
  deviceConnectionBindSchema,
  deviceConnectionPollSchema,
  deviceConnectionStartSchema,
  deviceConnectionTokenQuerySchema,
  deviceCredentialIdParamSchema,
  deviceLinkCreateSchema,
  deviceLinkStatusSchema,
  deviceLinkUserCodeParamSchema
} from "./device-link.validation.js";

export class DeviceLinkController {
  constructor(
    private readonly service: DeviceLinkService,
    private readonly connectionService: DeviceConnectionService
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

  /*
   * Codeless connection flow (see device-connection.service.ts). START -
   * no auth required, mirrors the legacy POST /link.
   */
  startConnection: RequestHandler =
    async (request, response) => {
      const input =
        deviceConnectionStartSchema.parse(
          request.body
        );

      response.json(
        await this.connectionService.createConnection(
          input.deviceName ?? null
        )
      );
    };

  /*
   * POLL - authenticated by the client-only pollToken (deviceCode under
   * the hood), never the browser token. Reuses the exact same
   * single-delivery pollStatus() the legacy manual-code flow uses - the
   * polling mechanism is identical either way.
   */
  connectionStatus: RequestHandler =
    async (request, response) => {
      const input =
        deviceConnectionPollSchema.parse(
          request.body
        );

      response.json(
        await this.service.pollStatus(
          input.pollToken
        )
      );
    };

  /*
   * WEB preview - public/unauthenticated by design (the browser may not
   * have signed in yet). Never returns pollToken/deviceCode/credential.
   */
  connectionPreview: RequestHandler =
    async (request, response) => {
      const token =
        deviceConnectionTokenQuerySchema.parse(
          request.query.token
        );

      response.json(
        await this.connectionService.previewConnection(
          token
        )
      );
    };

  /*
   * WEB bind - the "browser already has a valid SynTrack session" fast
   * path. Authenticated the same way every other raider-session-gated
   * endpoint in this file is.
   */
  bindConnection: RequestHandler =
    async (request, response) => {
      const input =
        deviceConnectionBindSchema.parse(
          request.body
        );

      const raiderSessionToken =
        requireBearerToken(request);

      response.json(
        await this.connectionService.bindConnection(
          input.token,
          raiderSessionToken
        )
      );
    };
}
