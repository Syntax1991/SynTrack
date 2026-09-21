/*
 * Resolves and validates the SynTrack desktop-client release version, then
 * prints the release naming contract as JSON for scripts/release-client.ps1
 * to consume. Run with tsx so the release script and its test suite
 * (modules/data-platform/api/client-download/client-release-version.test.ts)
 * share one implementation instead of a PowerShell copy drifting from it.
 *
 * Usage:
 *   npx tsx scripts/release/print-client-release-info.ts --csproj <path>
 *   npx tsx scripts/release/print-client-release-info.ts --csproj <path> --version=1.2.3
 */
import { readFile } from "node:fs/promises";
import {
  buildChecksumFileName,
  buildInstallerFileName,
  extractVersionFromCsproj,
  isValidClientVersion
} from "../../modules/data-platform/api/client-download/client-release-version.js";

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const flagIndex = process.argv.indexOf(`--${name}`);
  if (flagIndex !== -1) {
    return process.argv[flagIndex + 1];
  }

  return undefined;
}

async function main(): Promise<void> {
  const csprojPath = readArg("csproj");
  const versionOverride = readArg("version");

  if (!csprojPath) {
    throw new Error("Missing required --csproj <path> argument.");
  }

  let version: string;

  if (versionOverride) {
    version = versionOverride;
  }
  else {
    const csprojXml = await readFile(csprojPath, "utf8");
    version = extractVersionFromCsproj(csprojXml);
  }

  if (!isValidClientVersion(version)) {
    throw new Error(
      `Invalid release version "${version}". Expected MAJOR.MINOR.PATCH (e.g. 1.2.3).`
    );
  }

  const installerFileName = buildInstallerFileName(version);
  const checksumFileName = buildChecksumFileName(installerFileName);

  process.stdout.write(
    JSON.stringify({
      version,
      installerFileName,
      checksumFileName
    })
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
