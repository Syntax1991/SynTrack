const semverPattern = /^\d+\.\d+\.\d+$/u;
const csprojVersionPattern = /<Version>\s*([^<\s]+)\s*<\/Version>/u;

/*
 * The MAJOR.MINOR.PATCH contract the release pipeline enforces. This is
 * intentionally the same shape the backend's own version-extraction regex
 * (see client-download.service.ts's versionPattern) expects out of a
 * SynTrackClientSetup-<version>.exe filename, so a version that passes
 * here is guaranteed to round-trip through the download API unchanged.
 */
export function isValidClientVersion(
  version: string
): boolean {
  return semverPattern.test(version);
}

export function buildInstallerFileName(
  version: string
): string {
  if (!isValidClientVersion(version)) {
    throw new Error(
      `Invalid release version "${version}". Expected MAJOR.MINOR.PATCH (e.g. 1.2.3).`
    );
  }

  return `SynTrackClientSetup-${version}.exe`;
}

export function buildChecksumFileName(
  installerFileName: string
): string {
  return `${installerFileName}.sha256`;
}

/*
 * SynTrack.Client.csproj's <Version> element is the single authoritative
 * product version - the release pipeline reads it here instead of
 * maintaining a second, separately-updated version number.
 */
export function extractVersionFromCsproj(
  csprojXml: string
): string {
  const match = csprojVersionPattern.exec(csprojXml);
  const version = match?.[1];

  if (!version) {
    throw new Error(
      "No <Version> element found in the client .csproj."
    );
  }

  return version;
}
