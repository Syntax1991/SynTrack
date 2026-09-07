import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * Phase G4B corrective: modules/guild was deleted in full (not merely
 * unmounted from routes/nav) - this guards against it quietly
 * reappearing, or any source file importing from a "guild" path
 * segment again, without needing a full repo-wide grep every time.
 */

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);

const scanRoots = ["modules", "apps/api/src", "apps/web/src"];
const checkedExtensions = new Set([".ts", ".tsx"]);
const guildImportPattern = /from\s+["'][^"']*\/guild\/[^"']*["']/u;

async function collectSourceFiles(directory: string): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  }
  catch {
    return [];
  }

  const files: string[] = [];

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

describe("no runtime module imports modules/guild", () => {
  it("modules/guild does not exist", async () => {
    await expect(
      stat(path.join(projectRoot, "modules", "guild"))
    ).rejects.toThrow();
  });

  it("no source file under modules/, apps/api/src/, or apps/web/src/ imports a /guild/ path", async () => {
    const violations: string[] = [];

    for (const root of scanRoots) {
      const files = await collectSourceFiles(
        path.join(projectRoot, root)
      );

      for (const file of files) {
        const content = await readFile(file, "utf8");

        if (guildImportPattern.test(content)) {
          violations.push(path.relative(projectRoot, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
