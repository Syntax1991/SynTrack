import { openObservationDb, parseArgs, printTable } from "./observations-db.mjs";

/*
 * npm run observations:list
 * npm run observations:list -- --source BLIZZARD --domain EQUIPMENT --character Synbeast
 * npm run observations:list -- --limit 50
 */
const { flags } = parseArgs(process.argv.slice(2));
const limit = flags.limit ? Number(flags.limit) : 20;

const conditions = [];
const params = { limit };

if (flags.source) {
  conditions.push("source = @source");
  params.source = String(flags.source).toUpperCase();
}

if (flags.domain) {
  conditions.push("domain = @domain");
  params.domain = String(flags.domain).toUpperCase();
}

if (flags.character) {
  conditions.push("characterName = @character");
  params.character = String(flags.character);
}

const whereClause =
  conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

const db = openObservationDb();

const rows = db
  .prepare(
    `
    SELECT id, source, domain, characterName, realmSlug, endpoint, httpStatus, capturedAt
    FROM ingest_observations
    ${whereClause}
    ORDER BY capturedAt DESC, id DESC
    LIMIT @limit
    `
  )
  .all(params);

db.close();

printTable(
  ["ID", "SOURCE", "DOMAIN", "CHARACTER", "REALM", "ENDPOINT", "STATUS", "CAPTURED"],
  rows.map((row) => [
    row.id,
    row.source,
    row.domain,
    row.characterName ?? "-",
    row.realmSlug ?? "-",
    row.endpoint ?? "-",
    row.httpStatus ?? "-",
    row.capturedAt
  ])
);
