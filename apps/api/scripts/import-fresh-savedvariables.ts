/*
 * One-off developer tool for THIS diagnosis: imports a real
 * SynTrack_Professions.lua SavedVariables file directly through the same
 * AddonImportService/AddonImportPersistence path the HTTP /import route
 * uses, without needing the server running or a browser file picker.
 * Writes to the same dev.db every other script in this repo uses.
 */
import fs from "node:fs";
import { AddonImportPersistence } from "../../../modules/data-platform/api/integrations/addon/addon-import.persistence.js";
import { AddonImportService } from "../../../modules/data-platform/api/integrations/addon/addon-import.service.js";

const path = process.argv[2];

if (!path) {
  throw new Error("Usage: tsx import-fresh-savedvariables.ts <path-to-lua-file>");
}

const source = fs.readFileSync(path, "utf8");

const persistence = new AddonImportPersistence();
const service = new AddonImportService(persistence);

async function main() {
  const result = await service.importSavedVariables(source);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
