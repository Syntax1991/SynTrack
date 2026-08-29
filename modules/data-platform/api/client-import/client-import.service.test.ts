import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientImportService } from "./client-import.service.js";
import type { ClientImportHeaders } from "./client-import.types.js";
import type { AddonImportResult } from "../integrations/addon/addon-import.types.js";

const validHeaders: ClientImportHeaders =
  {
    protocolVersion: "1",
    addon: "SynTrackCoreDB",
    clientVersion: "0.1.0",
    observedAt:
      "2026-08-27T12:00:00.000Z",
    fileModifiedAt:
      "2026-08-27T11:59:00.000Z",
    contentSha256: undefined
  };

const fakeImportResult: AddonImportResult =
  {
    addonVersion: "1.0.0",
    schemaVersion: 1,
    importedAt:
      "2026-08-27T12:00:00.000Z",
    processed: {
      catalogs: 0,
      trees: 0,
      specializationNodes: 0,
      characters: 1,
      professionAssignments: 0,
      progressEntries: 0,
      gearSlots: 0,
      resourceSnapshots: 0,
      professionWeeklySnapshots: 0,
      professionKnowledgeTreasureSnapshots: 0
    }
  };

let importSavedVariables: ReturnType<
  typeof vi.fn<
    (
      source: string
    ) => Promise<AddonImportResult>
  >
>;

let service: ClientImportService;

beforeEach(() => {
  importSavedVariables = vi
    .fn<
      (
        source: string
      ) => Promise<AddonImportResult>
    >()
    .mockResolvedValue(
      fakeImportResult
    );

  service = new ClientImportService(
    (source: string) =>
      importSavedVariables(source)
  );
});

describe("ClientImportService", () => {
  it("dispatches the raw body unchanged to AddonImportService", async () => {
    const rawBody =
      'SynTrackCoreDB = { ["format"] = "syntrack-saved-variables" }';

    await service.importFromDevice({
      rawBody,
      headers: validHeaders
    });

    expect(
      importSavedVariables
    ).toHaveBeenCalledWith(rawBody);
  });

  it("returns a structured result carrying the addon and observed timestamps", async () => {
    const result =
      await service.importFromDevice(
        {
          rawBody: "SynTrackCoreDB = {}",
          headers: validHeaders
        }
      );

    expect(result).toEqual({
      addon: "SynTrackCoreDB",
      observedAt:
        validHeaders.observedAt,
      fileModifiedAt:
        validHeaders.fileModifiedAt,
      import: fakeImportResult
    });
  });

  it("accepts ProfessionTrackerDB as an allowed addon", async () => {
    await expect(
      service.importFromDevice({
        rawBody:
          "ProfessionTrackerDB = {}",
        headers: {
          ...validHeaders,
          addon: "ProfessionTrackerDB"
        }
      })
    ).resolves.toMatchObject({
      addon: "ProfessionTrackerDB"
    });
  });

  it("rejects an empty body", async () => {
    await expect(
      service.importFromDevice({
        rawBody: "   ",
        headers: validHeaders
      })
    ).rejects.toThrow(
      "SavedVariables body must not be empty."
    );

    expect(
      importSavedVariables
    ).not.toHaveBeenCalled();
  });

  it("rejects an unsupported protocol version", async () => {
    await expect(
      service.importFromDevice({
        rawBody: "SynTrackCoreDB = {}",
        headers: {
          ...validHeaders,
          protocolVersion: "2"
        }
      })
    ).rejects.toThrow(
      "Unsupported client protocol version"
    );
  });

  it("rejects an addon that is not in the accepted allowlist", async () => {
    await expect(
      service.importFromDevice({
        rawBody:
          "SynTrack_GuildDB = {}",
        headers: {
          ...validHeaders,
          addon: "SynTrack_GuildDB"
        }
      })
    ).rejects.toThrow(
      /Unsupported addon/
    );

    expect(
      importSavedVariables
    ).not.toHaveBeenCalled();
  });

  it("rejects a missing client version header", async () => {
    await expect(
      service.importFromDevice({
        rawBody: "SynTrackCoreDB = {}",
        headers: {
          ...validHeaders,
          clientVersion: undefined
        }
      })
    ).rejects.toThrow(
      "X-SynTrack-Client-Version header is required."
    );
  });

  it("rejects a missing or invalid observedAt timestamp", async () => {
    await expect(
      service.importFromDevice({
        rawBody: "SynTrackCoreDB = {}",
        headers: {
          ...validHeaders,
          observedAt: "not-a-date"
        }
      })
    ).rejects.toThrow(
      "X-SynTrack-Observed-At header must be a valid timestamp."
    );
  });

  it("rejects a missing or invalid fileModifiedAt timestamp", async () => {
    await expect(
      service.importFromDevice({
        rawBody: "SynTrackCoreDB = {}",
        headers: {
          ...validHeaders,
          fileModifiedAt: undefined
        }
      })
    ).rejects.toThrow(
      "X-SynTrack-File-Modified-At header must be a valid timestamp."
    );
  });

  it("accepts a request with no content hash header at all", async () => {
    await expect(
      service.importFromDevice({
        rawBody: "SynTrackCoreDB = {}",
        headers: validHeaders
      })
    ).resolves.toBeDefined();
  });

  it("accepts a request whose content hash matches the received body", async () => {
    const rawBody = "SynTrackCoreDB = {}";

    const contentSha256 = createHash(
      "sha256"
    )
      .update(rawBody, "utf8")
      .digest("hex");

    await expect(
      service.importFromDevice({
        rawBody,
        headers: {
          ...validHeaders,
          contentSha256
        }
      })
    ).resolves.toBeDefined();
  });

  it("rejects a request whose content hash does not match the received body", async () => {
    await expect(
      service.importFromDevice({
        rawBody: "SynTrackCoreDB = {}",
        headers: {
          ...validHeaders,
          contentSha256:
            "0".repeat(64)
        }
      })
    ).rejects.toThrow(
      "X-SynTrack-Content-SHA256 does not match the received body."
    );

    expect(
      importSavedVariables
    ).not.toHaveBeenCalled();
  });
});
