import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientDownloadCard } from "./ClientDownloadCard";

vi.mock("../api/clientDownloadApi", () => ({
  getClientDownloadInfo: vi.fn(),
  getClientDownloadFileUrl: () =>
    "http://localhost:4000/api/client-download/file"
}));

import { getClientDownloadInfo } from "../api/clientDownloadApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("ClientDownloadCard", () => {
  it("shows a real download link with version and size when a build is available", async () => {
    vi.mocked(getClientDownloadInfo).mockResolvedValue({
      available: true,
      fileName: "SynTrackClientSetup-1.4.2.exe",
      version: "1.4.2",
      sizeBytes: 52_428_800,
      releasedAt: new Date().toISOString()
    });

    render(<ClientDownloadCard />);

    const link = await screen.findByRole("link", {
      name: /Download for Windows \(v1\.4\.2\)/
    });

    expect(link).toHaveAttribute(
      "href",
      "http://localhost:4000/api/client-download/file"
    );
    expect(screen.getByText(/50\.0 MB/)).toBeInTheDocument();
  });

  it("shows a not-available message instead of a broken link when no build exists", async () => {
    vi.mocked(getClientDownloadInfo).mockResolvedValue({
      available: false
    });

    render(<ClientDownloadCard />);

    expect(
      await screen.findByText(/No build is available/)
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: /Download for Windows/ })
    ).not.toBeInTheDocument();
  });

  it("degrades to the same not-available message on a fetch failure", async () => {
    vi.mocked(getClientDownloadInfo).mockRejectedValue(
      new Error("network down")
    );

    render(<ClientDownloadCard />);

    expect(
      await screen.findByText(/No build is available/)
    ).toBeInTheDocument();
  });
});
