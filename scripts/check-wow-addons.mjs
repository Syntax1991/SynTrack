import {
  access,
  readdir,
  readFile
} from "node:fs/promises";
import path from "node:path";

const mainModuleSlugs = [
  "my-syntrack",
  "guild",
  "loot",
  "professions",
  "recruitment",
  "automation",
  "data-platform"
];

const requiredMetadata = [
  "Interface",
  "Title",
  "Version"
];

function parseManifest(source) {
  const metadata = new Map();
  const files = [];

  for (
    const sourceLine of
    source.split(/\r?\n/u)
  ) {
    const line =
      sourceLine.trim();

    if (!line) {
      continue;
    }

    const metadataMatch =
      /^##\s*([^:]+):\s*(.+)$/u.exec(
        line
      );

    if (metadataMatch) {
      metadata.set(
        metadataMatch[1].trim(),
        metadataMatch[2].trim()
      );
      continue;
    }

    if (!line.startsWith("#")) {
      files.push(
        line.replaceAll(
          "\\",
          "/"
        )
      );
    }
  }

  return {
    metadata,
    files
  };
}

async function addonViolations(
  moduleSlug,
  addonEntry
) {
  const violations = [];
  const addonDirectory =
    path.join(
      "modules",
      moduleSlug,
      "addons",
      addonEntry.name
    );

  const manifestPath =
    path.join(
      addonDirectory,
      `${addonEntry.name}.toc`
    );

  let manifestSource;

  try {
    manifestSource =
      await readFile(
        manifestPath,
        "utf8"
      );
  } catch {
    return [
      `${manifestPath} is missing.`
    ];
  }

  const manifest =
    parseManifest(
      manifestSource
    );

  for (
    const metadataKey of
    requiredMetadata
  ) {
    if (
      !manifest.metadata.has(
        metadataKey
      )
    ) {
      violations.push(
        `${manifestPath} is missing ## ${metadataKey}.`
      );
    }
  }

  const entries =
    await readdir(
      addonDirectory,
      {
        withFileTypes: true
      }
    );

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

  const listedFiles =
    new Set(
      manifest.files.map(
        (file) =>
          file.toLowerCase()
      )
    );

  for (
    const manifestFile of
    manifest.files
  ) {
    try {
      await access(
        path.join(
          addonDirectory,
          manifestFile
        )
      );
    } catch {
      violations.push(
        `${manifestPath} references missing file ${manifestFile}.`
      );
    }
  }

  for (
    const entry of
    entries
  ) {
    if (
      entry.isFile() &&
      path.extname(
        entry.name
      ).toLowerCase() === ".lua" &&
      !listedFiles.has(
        entry.name.toLowerCase()
      )
    ) {
      violations.push(
        `${addonDirectory}/${entry.name} is not listed in the TOC.`
      );
    }
  }

  if (
    addonEntry.name ===
    "SynTrack_Core"
  ) {
    if (
      manifest.metadata.get(
        "SavedVariables"
      ) !== "SynTrackCoreDB"
    ) {
      violations.push(
        `${manifestPath} must persist SynTrackCoreDB.`
      );
    }

    if (
      manifest.metadata.get(
        "X-SynTrack-Module"
      ) !== "core"
    ) {
      violations.push(
        `${manifestPath} must declare the core module id.`
      );
    }
  }

  return violations;
}

const violations = [];
let addonCount = 0;

for (
  const moduleSlug of
  mainModuleSlugs
) {
  const addonsDirectory =
    path.join(
      "modules",
      moduleSlug,
      "addons"
    );

  const entries =
    await readdir(
      addonsDirectory,
      {
        withFileTypes: true
      }
    );

  for (
    const entry of
    entries
  ) {
    if (!entry.isDirectory()) {
      continue;
    }

    addonCount += 1;

    violations.push(
      ...(
        await addonViolations(
          moduleSlug,
          entry
        )
      )
    );
  }
}

if (violations.length > 0) {
  console.error(
    "WoW addon manifests are invalid."
  );

  for (
    const violation of
    violations
  ) {
    console.error(
      `- ${violation}`
    );
  }

  process.exit(1);
}

console.log(
  `WoW addon check passed for ${addonCount} addons.`
);
