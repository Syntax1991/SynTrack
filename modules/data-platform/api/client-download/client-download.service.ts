import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { ClientDownloadInfo } from "./client-download.types.js";

const versionPattern = /-(\d+\.\d+\.\d+)\.exe$/iu;

/*
 * Self-hosted desktop-client distribution: the operator drops a built
 * SynTrackClientSetup-<version>.exe into CLIENT_DOWNLOAD_DIR (see
 * env.ts) and this always serves whichever file in that directory was
 * modified most recently, by ANY ".exe" name - no strict naming
 * convention is enforced so a manual drop-in never silently fails to
 * be found. The download route never accepts a client-supplied file
 * name; it only ever serves the path this scan itself resolved, which
 * is what keeps it safe from path traversal.
 */
export class ClientDownloadService {
  constructor(
    private readonly downloadDirectory: string
  ) {}

  async findLatest(): Promise<
    { fileName: string; filePath: string; sizeBytes: number; releasedAt: Date } | null
  > {
    let entries;

    try {
      entries = await readdir(this.downloadDirectory, {
        withFileTypes: true
      });
    }
    catch {
      return null;
    }

    const candidates = entries.filter(
      (entry) =>
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".exe")
    );

    let latest: {
      fileName: string;
      filePath: string;
      sizeBytes: number;
      releasedAt: Date;
    } | null = null;

    for (const entry of candidates) {
      const filePath = path.join(
        this.downloadDirectory,
        entry.name
      );

      const stats = await stat(filePath);

      if (!latest || stats.mtime > latest.releasedAt) {
        latest = {
          fileName: entry.name,
          filePath,
          sizeBytes: stats.size,
          releasedAt: stats.mtime
        };
      }
    }

    return latest;
  }

  async getInfo(): Promise<ClientDownloadInfo> {
    const latest = await this.findLatest();

    if (!latest) {
      return { available: false };
    }

    const versionMatch = versionPattern.exec(
      latest.fileName
    );

    return {
      available: true,
      fileName: latest.fileName,
      version: versionMatch?.[1] ?? null,
      sizeBytes: latest.sizeBytes,
      releasedAt: latest.releasedAt.toISOString()
    };
  }
}
