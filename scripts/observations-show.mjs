import { openObservationDb, parseArgs } from "./observations-db.mjs";

// npm run observations:show -- <id>
const { positionals } = parseArgs(process.argv.slice(2));
const id = Number(positionals[0]);

if (!Number.isInteger(id)) {
  console.error("Usage: npm run observations:show -- <id>");
  process.exit(1);
}

const db = openObservationDb();
const row = db
  .prepare("SELECT * FROM ingest_observations WHERE id = ?")
  .get(id);
db.close();

if (!row) {
  console.error(`No observation found with id ${id}.`);
  process.exit(1);
}

console.log(`ID:           ${row.id}`);
console.log(`Source:       ${row.source}`);
console.log(`Domain:       ${row.domain}`);
console.log(`Stage:        ${row.stage}`);
console.log(
  `Character:    ${row.characterName ?? "-"} (internal id: ${row.characterId ?? "unknown"})`
);
console.log(`Realm/Region: ${row.realmSlug ?? "-"} / ${row.region ?? "-"}`);
console.log(`Endpoint:     ${row.endpoint ?? "-"}`);
console.log(`HTTP status:  ${row.httpStatus ?? "-"}`);
console.log(`Schema ver.:  ${row.schemaVersion ?? "-"}`);
console.log(`Captured at:  ${row.capturedAt}`);
console.log("");
console.log(JSON.stringify(JSON.parse(row.payloadJson), null, 2));
