import type { RequestHandler } from "express";
import { ClientImportService } from "./client-import.service.js";
import type { ClientImportHeaders } from "./client-import.types.js";

function readHeaders(
  request: Parameters<RequestHandler>[0]
): ClientImportHeaders {
  return {
    protocolVersion:
      request.header(
        "X-SynTrack-Protocol-Version"
      ),
    addon: request.header(
      "X-SynTrack-Addon"
    ),
    clientVersion: request.header(
      "X-SynTrack-Client-Version"
    ),
    observedAt: request.header(
      "X-SynTrack-Observed-At"
    ),
    fileModifiedAt: request.header(
      "X-SynTrack-File-Modified-At"
    ),
    contentSha256: request.header(
      "X-SynTrack-Content-SHA256"
    )
  };
}

export class ClientImportController {
  constructor(
    private readonly service: ClientImportService
  ) {}

  import: RequestHandler = async (
    request,
    response
  ) => {
    const rawBody =
      typeof request.body === "string"
        ? request.body
        : "";

    const result =
      await this.service.importFromDevice(
        {
          rawBody,
          headers: readHeaders(request)
        }
      );

    response.json(result);
  };
}
