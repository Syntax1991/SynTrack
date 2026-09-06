import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

/*
 * Mirrors apps/api/src/config/env.ts's INGEST_OBSERVATION_DB_PATH
 * default and its "resolved relative to apps/api" convention (the same
 * way DATABASE_URL is resolved for dev.db) - kept as a small standalone
 * duplication here rather than importing TypeScript into a plain Node
 * script, since this is diagnostic tooling, not business logic.
 */
export function resolveObservationDbPath() {
  const override = process.env.INGEST_OBSERVATION_DB_PATH;
  const relative =
    override && override.trim().length > 0
      ? override
      : "./prisma/ingest-observation.db";

  return path.resolve(projectRoot, "apps/api", relative);
}

export function openObservationDb() {
  const dbPath = resolveObservationDbPath();

  if (!fs.existsSync(dbPath)) {
    console.error(`No observation database found at ${dbPath}.`);
    console.error(
      "Nothing has been captured yet, or INGEST_OBSERVATION_ENABLED is disabled."
    );
    process.exit(1);
  }

  return new Database(dbPath, { readonly: true });
}

export function parseArgs(args) {
  const flags = {};
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[index + 1];
      const hasValue = next !== undefined && !next.startsWith("--");
      flags[key] = hasValue ? next : true;
      if (hasValue) {
        index += 1;
      }
    }
    else {
      positionals.push(arg);
    }
  }

  return { flags, positionals };
}

export function printTable(header, rows) {
  if (rows.length === 0) {
    console.log("No observations found.");
    return;
  }

  const widths = header.map((label, columnIndex) =>
    Math.max(
      label.length,
      ...rows.map((row) => String(row[columnIndex]).length)
    )
  );

  const formatRow = (row) =>
    row
      .map((cell, columnIndex) => String(cell).padEnd(widths[columnIndex]))
      .join("  ");

  console.log(formatRow(header));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    console.log(formatRow(row));
  }
}
