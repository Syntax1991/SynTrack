import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ingestObservationConfig } from "./ingest-observation.config.js";
import { recordIngestObservation } from "./ingest-observation.writer.js";
import type { IngestObservationRow } from "./ingest-observation.types.js";

function tempDbPath(): string {
  return path.join(
    os.tmpdir(),
    `syntrack-ingest-observation-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
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

describe("recordIngestObservation", () => {
  it("does nothing when observation is disabled - no file is even created", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = false;
    ingestObservationConfig.databasePath = databasePath;

    expect(() =>
      recordIngestObservation({
        source: "ADDON",
        domain: "GEAR",
        characterName: "Synblast",
        payload: { itemLink: "item:1" }
      })
    ).not.toThrow();

    expect(fs.existsSync(databasePath)).toBe(false);
  });

  it("stores an observation when enabled", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    recordIngestObservation({
      source: "ADDON",
      domain: "GEAR",
      characterName: "Synblast",
      realmSlug: "antonidas",
      region: "eu",
      payload: { itemLink: "item:271483:6807", uniqueCategoryCount: 2 }
    });

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: "ADDON",
      domain: "GEAR",
      stage: "RAW",
      characterName: "Synblast",
      realmSlug: "antonidas",
      region: "eu"
    });
    expect(JSON.parse(rows[0]!.payloadJson)).toEqual({
      itemLink: "item:271483:6807",
      uniqueCategoryCount: 2
    });
  });

  it("never throws when the observation database cannot be opened - real callers can rely on this unconditionally", () => {
    const brokenPath = tempDbPath();
    createdPaths.push(brokenPath);
    fs.mkdirSync(brokenPath, { recursive: true });
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = brokenPath;

    expect(() =>
      recordIngestObservation({
        source: "BLIZZARD",
        domain: "EQUIPMENT",
        characterName: "Synbeast",
        payload: { itemId: 219749 }
      })
    ).not.toThrow();
  });

  it("retention: keeps only the latest 10 observations per source/domain/character", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    for (let index = 0; index < 13; index += 1) {
      recordIngestObservation({
        source: "BLIZZARD",
        domain: "PROFILE",
        characterName: "Synblast",
        payload: { sequence: index }
      });
    }

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(10);

    const sequences = rows
      .map((row) => JSON.parse(row.payloadJson).sequence as number)
      .sort((left, right) => left - right);
    // The 3 oldest inserts (sequence 0, 1, 2) must have been pruned -
    // only the latest 10 (sequence 3..12) remain.
    expect(sequences).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("retention groups independently per source/domain/character - unrelated groups are unaffected", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    for (let index = 0; index < 12; index += 1) {
      recordIngestObservation({
        source: "BLIZZARD",
        domain: "PROFILE",
        characterName: "Synblast",
        payload: { sequence: index }
      });
    }

    recordIngestObservation({
      source: "ADDON",
      domain: "GEAR",
      characterName: "Synblast",
      payload: { sequence: "unrelated" }
    });

    recordIngestObservation({
      source: "BLIZZARD",
      domain: "PROFILE",
      characterName: "Synbeast",
      payload: { sequence: "other-character" }
    });

    const rows = readAllRows(databasePath);
    expect(rows.filter((row) => row.domain === "GEAR")).toHaveLength(1);
    expect(
      rows.filter((row) => row.characterName === "Synbeast")
    ).toHaveLength(1);
    expect(
      rows.filter(
        (row) => row.domain === "PROFILE" && row.characterName === "Synblast"
      )
    ).toHaveLength(10);
  });
});
