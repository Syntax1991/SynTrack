import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

/*
 * Phase G4B corrective: modules/guild was deleted in full (not merely
 * unmounted from routes/nav) - this guards against it quietly
 * reappearing, or any source file importing from a "guild" path
 * segment again, without needing a full repo-wide grep every time.
 *
 * Relocated here from modules/loot/shared/member-link/no-guild-imports.test.ts
 * when the Loot module was removed - this check is repo-wide and was never
 * actually about Loot, so it belongs alongside the other architecture
 * checks rather than disappearing with the module it happened to live in.
 */

const scanRoots = ["modules", "apps/api/src", "apps/web/src"];
const checkedExtensions = new Set([".ts", ".tsx"]);
const guildImportPattern = /from\s+["'][^"']*\/guild\/[^"']*["']/u;

async function collectSourceFiles(directory) {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  }
  catch {
    return [];
  }

  const files = [];

  for (const entry of entries) {
    if (entry.name === "generated" || entry.name === "node_modules") {
      continue;
    }

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
      continue;
    }

    if (checkedExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

const violations = [];

try {
  await stat(path.join("modules", "guild"));
  violations.push("modules/guild exists again.");
}
catch {
  // Expected: modules/guild must not exist.
}

for (const root of scanRoots) {
  const files = await collectSourceFiles(root);

  for (const file of files) {
    const content = await readFile(file, "utf8");

    if (guildImportPattern.test(content)) {
      violations.push(`${file} imports a /guild/ path.`);
    }
  }
}

if (violations.length > 0) {
  console.error("Guild-removal regression check failed.");

  for (const violation of violations) {
    console.error(`- ${violation}`);
  }

  process.exit(1);
}

console.log("No guild imports check passed.");
