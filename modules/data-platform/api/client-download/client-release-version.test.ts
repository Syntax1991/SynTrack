import { describe, expect, it } from "vitest";
import {
  buildChecksumFileName,
  buildInstallerFileName,
  extractVersionFromCsproj,
  isValidClientVersion
} from "./client-release-version.js";
import { ClientDownloadService } from "./client-download.service.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("isValidClientVersion", () => {
  it("accepts MAJOR.MINOR.PATCH versions", () => {
    expect(isValidClientVersion("0.1.0")).toBe(true);
    expect(isValidClientVersion("1.0.0")).toBe(true);
    expect(isValidClientVersion("1.2.3")).toBe(true);
    expect(isValidClientVersion("1.10.0")).toBe(true);
  });

  it("rejects malformed release versions", () => {
    expect(isValidClientVersion("1.0")).toBe(false);
    expect(isValidClientVersion("1.0.0-beta")).toBe(false);
    expect(isValidClientVersion("v1.0.0")).toBe(false);
    expect(isValidClientVersion("1.0.0.0")).toBe(false);
    expect(isValidClientVersion("")).toBe(false);
  });
});

describe("buildInstallerFileName", () => {
  it("produces the expected filename convention", () => {
    expect(buildInstallerFileName("0.1.0")).toBe(
      "SynTrackClientSetup-0.1.0.exe"
    );
  });

  it("throws for an invalid version instead of producing a bad filename", () => {
    expect(() => buildInstallerFileName("not-a-version")).toThrow(
      /Invalid release version/u
    );
  });

  it("round-trips through the backend's own version-extraction regex", async () => {
    const dir = await mkdtemp(
      path.join(os.tmpdir(), "syntrack-release-version-test-")
    );

    try {
      const fileName = buildInstallerFileName("1.10.0");
      await writeFile(path.join(dir, fileName), "fake installer bytes");

      const service = new ClientDownloadService(dir);
      const info = await service.getInfo();

      expect(info).toMatchObject({
        available: true,
        fileName,
        version: "1.10.0"
      });
    }
    finally {
      await rm(dir, { force: true, recursive: true });
    }
  });
});

describe("buildChecksumFileName", () => {
  it("appends .sha256 to the installer filename", () => {
    expect(
      buildChecksumFileName("SynTrackClientSetup-0.1.0.exe")
    ).toBe("SynTrackClientSetup-0.1.0.exe.sha256");
  });
});

describe("extractVersionFromCsproj", () => {
  it("reads the <Version> element", () => {
    const csproj = `
      <Project Sdk="Microsoft.NET.Sdk">
        <PropertyGroup>
          <Version>0.1.0</Version>
        </PropertyGroup>
      </Project>
    `;

    expect(extractVersionFromCsproj(csproj)).toBe("0.1.0");
  });

  it("throws when no <Version> element is present", () => {
    expect(() =>
      extractVersionFromCsproj(
        "<Project><PropertyGroup></PropertyGroup></Project>"
      )
    ).toThrow(/No <Version> element/u);
  });
});
