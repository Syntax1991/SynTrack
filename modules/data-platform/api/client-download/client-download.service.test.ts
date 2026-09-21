import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ClientDownloadService } from "./client-download.service.js";

async function tempDir(): Promise<string> {
  return mkdtemp(
    path.join(os.tmpdir(), "syntrack-client-download-test-")
  );
}

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await rm(dir, { force: true, recursive: true });
  }
});

describe("ClientDownloadService", () => {
  it("reports unavailable when the download directory does not exist", async () => {
    const dir = path.join(
      os.tmpdir(),
      "syntrack-client-download-missing"
    );

    const service = new ClientDownloadService(dir);

    await expect(service.getInfo()).resolves.toEqual({
      available: false
    });
    await expect(service.findLatest()).resolves.toBeNull();
  });

  it("reports unavailable when the directory has no .exe files", async () => {
    const dir = await tempDir();
    createdDirs.push(dir);
    await writeFile(path.join(dir, "readme.txt"), "not an installer");

    const service = new ClientDownloadService(dir);

    await expect(service.getInfo()).resolves.toEqual({
      available: false
    });
  });

  it("finds a single installer and extracts its version from the filename", async () => {
    const dir = await tempDir();
    createdDirs.push(dir);
    await writeFile(
      path.join(dir, "SynTrackClientSetup-1.4.2.exe"),
      "fake installer bytes"
    );

    const service = new ClientDownloadService(dir);
    const info = await service.getInfo();

    expect(info).toMatchObject({
      available: true,
      fileName: "SynTrackClientSetup-1.4.2.exe",
      version: "1.4.2"
    });

    if (info.available) {
      expect(info.sizeBytes).toBeGreaterThan(0);
      expect(new Date(info.releasedAt).getTime()).not.toBeNaN();
    }
  });

  it("returns null version when the filename does not match the versioned convention", async () => {
    const dir = await tempDir();
    createdDirs.push(dir);
    await writeFile(
      path.join(dir, "SynTrackSetup.exe"),
      "fake installer bytes"
    );

    const service = new ClientDownloadService(dir);
    const info = await service.getInfo();

    expect(info).toMatchObject({
      available: true,
      fileName: "SynTrackSetup.exe",
      version: null
    });
  });

  it("picks the most recently modified .exe when multiple exist", async () => {
    const dir = await tempDir();
    createdDirs.push(dir);

    await writeFile(
      path.join(dir, "SynTrackClientSetup-1.0.0.exe"),
      "old"
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    await writeFile(
      path.join(dir, "SynTrackClientSetup-2.0.0.exe"),
      "new"
    );

    const service = new ClientDownloadService(dir);
    const info = await service.getInfo();

    expect(info).toMatchObject({
      available: true,
      fileName: "SynTrackClientSetup-2.0.0.exe",
      version: "2.0.0"
    });
  });

  it("ignores non-.exe files sitting alongside the installer", async () => {
    const dir = await tempDir();
    createdDirs.push(dir);

    await writeFile(
      path.join(dir, "SynTrackClientSetup-1.0.0.exe"),
      "installer"
    );
    await writeFile(path.join(dir, "CHANGELOG.md"), "notes");
    await mkdir(path.join(dir, "some-subdir"));

    const service = new ClientDownloadService(dir);
    const info = await service.getInfo();

    expect(info).toMatchObject({
      available: true,
      fileName: "SynTrackClientSetup-1.0.0.exe"
    });
  });
});
