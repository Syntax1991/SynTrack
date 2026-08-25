import {
  readdir,
  readFile
} from "node:fs/promises";
import path from "node:path";

const maximumLines = 350;

const sourceRoots = [
  "apps/api/src",
  "apps/web/src",
  "modules",
  "scripts"
];

const mainModuleSlugs = [
  "my-syntrack",
  "guild",
  "loot",
  "professions",
  "recruitment",
  "automation",
  "data-platform"
];

const checkedExtensions =
  new Set([
    ".ts",
    ".tsx",
    ".css",
    ".lua",
    ".toc",
    ".mjs",
    ".js",
    ".cjs"
  ]);

async function findSourceFiles(
  directory
) {
  const entries =
    await readdir(
      directory,
      {
        withFileTypes: true
      }
    );

  const files = [];

  for (
    const entry of
    entries
  ) {
    if (
      entry.name ===
      "generated"
    ) {
      continue;
    }

    const entryPath =
      path.join(
        directory,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      files.push(
        ...(
          await findSourceFiles(
            entryPath
          )
        )
      );

      continue;
    }

    if (
      checkedExtensions.has(
        path.extname(
          entry.name
        )
      )
    ) {
      files.push(
        entryPath
      );
    }
  }

  return files;
}

async function findModuleStructureViolations() {
  const violations = [];

  for (
    const moduleSlug of
    mainModuleSlugs
  ) {
    const addonDirectory =
      path.join(
        "modules",
        moduleSlug,
        "addons"
      );

    let entries;

    try {
      entries =
        await readdir(
          addonDirectory,
          {
            withFileTypes: true
          }
        );
    } catch {
      violations.push(
        `${addonDirectory} is missing.`
      );

      continue;
    }

    if (
      !entries.some(
        (entry) =>
          entry.isFile() &&
          entry.name === "README.md"
      )
    ) {
      violations.push(
        `${addonDirectory}/README.md is missing.`
      );
    }

    for (
      const entry of
      entries
    ) {
      if (
        entry.isFile() &&
        entry.name !== "README.md"
      ) {
        violations.push(
          `${addonDirectory}/${entry.name} must live inside an addon directory.`
        );
      }
    }
  }

  return violations;
}

const sourceGroups =
  await Promise.all(
    sourceRoots.map(
      (sourceRoot) =>
        findSourceFiles(
          sourceRoot
        )
    )
  );

const sourceFiles =
  sourceGroups.flat();

const moduleStructureViolations =
  await findModuleStructureViolations();

const violations = [];

for (
  const sourceFile of
  sourceFiles
) {
  const content =
    await readFile(
      sourceFile,
      "utf8"
    );

  const lineCount =
    content
      .split(
        /\r?\n/u
      )
      .length;

  if (
    lineCount >
    maximumLines
  ) {
    violations.push({
      sourceFile,
      lineCount
    });
  }
}

if (violations.length > 0) {
  console.error(
    `Source files may not exceed ${maximumLines} lines.`
  );

  for (
    const violation of
    violations
  ) {
    console.error(
      `- ${violation.sourceFile}: ${violation.lineCount} lines`
    );
  }
}

if (
  moduleStructureViolations.length > 0
) {
  console.error(
    "Main-module addon structure is invalid."
  );

  for (
    const violation of
    moduleStructureViolations
  ) {
    console.error(
      `- ${violation}`
    );
  }
}

if (
  violations.length > 0 ||
  moduleStructureViolations.length > 0
) {
  process.exit(1);
}

console.log(
  `Architecture check passed for ${sourceFiles.length} source files and ${mainModuleSlugs.length} module addon boundaries.`
);
