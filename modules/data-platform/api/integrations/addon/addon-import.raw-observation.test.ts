import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ingestObservationConfig } from "../../ingest-observation/ingest-observation.config.js";
import type { IngestObservationRow } from "../../ingest-observation/ingest-observation.types.js";
import { captureRawAddonGearObservations } from "./addon-import.raw-observation.js";
import type { LuaTable } from "./addon-import.types.js";

/*
 * Phase G3B proof points (task section 24, ADDON GEAR): capture happens
 * before normalization, the current addon's payload may omit
 * uniqueCategoryCount, and itemLink remains visible in the raw
 * observation regardless of which addon build sent it.
 */

function tempDbPath(): string {
  return path.join(
    os.tmpdir(),
    `syntrack-raw-observation-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
  );
}

function readAllRows(databasePath: string): IngestObservationRow[] {
  const db = new Database(databasePath, { readonly: true });

  try {
    return db
      .prepare("SELECT * FROM ingest_observations ORDER BY id ASC")
      .all() as IngestObservationRow[];
  }
  finally {
    db.close();
  }
}

const createdPaths: string[] = [];
const originalEnabled = ingestObservationConfig.enabled;
const originalDatabasePath = ingestObservationConfig.databasePath;

afterEach(() => {
  ingestObservationConfig.enabled = originalEnabled;
  ingestObservationConfig.databasePath = originalDatabasePath;

  for (const createdPath of createdPaths.splice(0)) {
    fs.rmSync(createdPath, { force: true, recursive: true });
  }
});

function enrichedGearRoot(gearOverrides: LuaTable = {}): LuaTable {
  return {
    characters: {
      "eu:antonidas:synbeast": {
        name: "Synbeast",
        realm: "Antonidas",
        region: "eu",
        modules: {
          gear: {
            schemaVersion: 2,
            data: {
              currentExpansionId: 11,
              slots: {
                HEAD: {
                  equipped: true,
                  itemId: 271483,
                  // Current addon shape: itemLink still present,
                  // uniqueCategoryCount already absent (post-G1).
                  itemLink: "item:271483:6807:213743:213743:0:0",
                  itemLevel: 315,
                  quality: 4,
                  socketCount: 2,
                  uniqueCategoryId: 42,
                  uniquenessResolved: true,
                  ...gearOverrides
                }
              },
              bagSetPieces: {}
            }
          }
        }
      }
    }
  };
}

describe("captureRawAddonGearObservations", () => {
  it("captures the raw gear module before normalization, with itemLink visible and uniqueCategoryCount absent (current addon shape)", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    captureRawAddonGearObservations(enrichedGearRoot());

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: "ADDON",
      domain: "GEAR",
      stage: "RAW",
      characterName: "Synbeast",
      realmSlug: "Antonidas",
      region: "eu"
    });

    const payload = JSON.parse(rows[0]!.payloadJson);
    const head = payload.data.slots.HEAD;
    expect(head.itemLink).toBe("item:271483:6807:213743:213743:0:0");
    expect(head.quality).toBe(4);
    expect(head.uniqueCategoryId).toBe(42);
    expect(head.uniquenessResolved).toBe(true);
    // Current addon build - never sent for this slot, and the raw
    // capture must not fabricate it either.
    expect("uniqueCategoryCount" in head).toBe(false);
  });

  it("preserves an OLD addon build's uniqueCategoryCount field exactly as sent, unmodified by capture", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    captureRawAddonGearObservations(
      enrichedGearRoot({ uniqueCategoryCount: 2 })
    );

    const rows = readAllRows(databasePath);
    const head = JSON.parse(rows[0]!.payloadJson).data.slots.HEAD;
    expect(head.uniqueCategoryCount).toBe(2);
  });

  it("captures nothing for a character with no gear module, without throwing", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    expect(() =>
      captureRawAddonGearObservations({
        characters: {
          "eu:antonidas:synlight": {
            name: "Synlight",
            realm: "Antonidas",
            region: "eu",
            modules: {}
          }
        }
      })
    ).not.toThrow();

    expect(fs.existsSync(databasePath)).toBe(false);
  });

  it("never throws when the observation database is unavailable, even mid-way through multiple characters", () => {
    const brokenPath = tempDbPath();
    createdPaths.push(brokenPath);
    fs.mkdirSync(brokenPath, { recursive: true });
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = brokenPath;

    const characters = { ...(enrichedGearRoot().characters as LuaTable) };
    characters["eu:antonidas:synlight"] = {
      name: "Synlight",
      realm: "Antonidas",
      region: "eu",
      modules: { gear: { schemaVersion: 2, data: { slots: {}, bagSetPieces: {} } } }
    };

    expect(() =>
      captureRawAddonGearObservations({ characters })
    ).not.toThrow();
  });
});
