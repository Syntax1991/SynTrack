import type { AddonImportResult } from "../integrations/addon/addon-import.types.js";

export const SUPPORTED_CLIENT_PROTOCOL_VERSION = "1";

export const ACCEPTED_CLIENT_ADDONS = [
  "SynTrackCoreDB",
  "ProfessionTrackerDB"
] as const;

export type ClientAddonName =
  (typeof ACCEPTED_CLIENT_ADDONS)[number];

export function isAcceptedClientAddon(
  value: string
): value is ClientAddonName {
  return (
    ACCEPTED_CLIENT_ADDONS as readonly string[]
  ).includes(value);
}

export type ClientImportHeaders = {
  protocolVersion: string | undefined;
  addon: string | undefined;
  clientVersion: string | undefined;
  observedAt: string | undefined;
  fileModifiedAt: string | undefined;
  contentSha256: string | undefined;
};

export type ClientImportResult = {
  addon: ClientAddonName;
  observedAt: string;
  fileModifiedAt: string;
  import: AddonImportResult;
};
