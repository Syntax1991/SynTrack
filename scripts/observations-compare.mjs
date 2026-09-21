import { openObservationDb, parseArgs } from "./observations-db.mjs";

// npm run observations:compare -- Synbeast
const { positionals } = parseArgs(process.argv.slice(2));
const characterName = positionals[0];

if (!characterName) {
  console.error("Usage: npm run observations:compare -- <characterName>");
  process.exit(1);
}

const db = openObservationDb();

function latest(source, domain) {
  return db
    .prepare(
      `
      SELECT * FROM ingest_observations
      WHERE source = ? AND domain = ? AND characterName = ?
      ORDER BY capturedAt DESC, id DESC
      LIMIT 1
      `
    )
    .get(source, domain, characterName);
}

const latestAddonGear = latest("ADDON", "GEAR");
const latestBlizzardEquipment = latest("BLIZZARD", "EQUIPMENT");

db.close();

function printSection(title, row) {
  console.log(`=== ${title} - ${characterName} ===`);

  if (!row) {
    console.log("(no observation found)");
  }
  else {
    console.log(`captured at ${row.capturedAt}`);
    console.log(JSON.stringify(JSON.parse(row.payloadJson), null, 2));
  }

  console.log("");
}

printSection("ADDON / GEAR", latestAddonGear);
printSection("BLIZZARD / EQUIPMENT", latestBlizzardEquipment);
