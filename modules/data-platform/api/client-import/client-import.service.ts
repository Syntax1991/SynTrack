import { createHash } from "node:crypto";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import {
  ACCEPTED_CLIENT_ADDONS,
  SUPPORTED_CLIENT_PROTOCOL_VERSION,
  isAcceptedClientAddon
} from "./client-import.types.js";
import type {
  ClientImportHeaders,
  ClientImportResult
} from "./client-import.types.js";
import type { AddonImportResult } from "../integrations/addon/addon-import.types.js";

function requireHeader(
  value: string | undefined,
  message: string
): string {
  if (!value || value.trim().length === 0) {
    throw new AppError(400, message);
  }

  return value;
}

function requireTimestampHeader(
  value: string | undefined,
  message: string
): string {
  const header = requireHeader(
    value,
    message
  );

  if (Number.isNaN(Date.parse(header))) {
    throw new AppError(400, message);
  }

  return header;
}

/*
 * The raw SavedVariables body is dispatched unchanged to the existing
 * AddonImportService - this route only validates transport metadata
 * (protocol/addon/timestamps/optional content hash) and never parses
 * Lua itself. observedAt/fileModifiedAt are filesystem-observed
 * timestamps and are never written over the gameplay capture time that
 * comes from inside the parsed payload.
 */
export class ClientImportService {
  constructor(
    private readonly importSavedVariables: (
      source: string
    ) => Promise<AddonImportResult>
  ) {}

  async importFromDevice(input: {
    rawBody: string;
    headers: ClientImportHeaders;
  }): Promise<ClientImportResult> {
    const { rawBody, headers } = input;

    if (rawBody.trim().length === 0) {
      throw new AppError(
        400,
        "SavedVariables body must not be empty."
      );
    }

    if (
      headers.protocolVersion !==
      SUPPORTED_CLIENT_PROTOCOL_VERSION
    ) {
      throw new AppError(
        400,
        `Unsupported client protocol version "${headers.protocolVersion ?? ""}". Supported version is ${SUPPORTED_CLIENT_PROTOCOL_VERSION}.`
      );
    }

    if (
      !headers.addon ||
      !isAcceptedClientAddon(headers.addon)
    ) {
      throw new AppError(
        400,
        `Unsupported addon "${headers.addon ?? ""}". Accepted addons: ${ACCEPTED_CLIENT_ADDONS.join(", ")}.`
      );
    }

    requireHeader(
      headers.clientVersion,
      "X-SynTrack-Client-Version header is required."
    );

    const observedAt =
      requireTimestampHeader(
        headers.observedAt,
        "X-SynTrack-Observed-At header must be a valid timestamp."
      );

    const fileModifiedAt =
      requireTimestampHeader(
        headers.fileModifiedAt,
        "X-SynTrack-File-Modified-At header must be a valid timestamp."
      );

    if (headers.contentSha256) {
      const actualHash = createHash(
        "sha256"
      )
        .update(rawBody, "utf8")
        .digest("hex");

      if (
        actualHash.toLowerCase() !==
        headers.contentSha256
          .trim()
          .toLowerCase()
      ) {
        throw new AppError(
          400,
          "X-SynTrack-Content-SHA256 does not match the received body."
        );
      }
    }

    const result =
      await this.importSavedVariables(
        rawBody
      );

    return {
      addon: headers.addon,
      observedAt,
      fileModifiedAt,
      import: result
    };
  }
}
