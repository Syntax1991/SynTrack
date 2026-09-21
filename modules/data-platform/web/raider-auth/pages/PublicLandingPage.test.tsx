import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { PublicLandingPage } from "./PublicLandingPage";

vi.mock("../api/raiderAuthApi", () => ({
  getRaiderSessionStatus: vi.fn()
}));

vi.mock("../../client-download/api/clientDownloadApi", () => ({
  getClientDownloadInfo: vi.fn().mockResolvedValue({ available: false }),
  getClientDownloadFileUrl: () => "http://localhost:4000/api/client-download/file"
}));

import { getRaiderSessionStatus } from "../api/raiderAuthApi";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <PublicLandingPage />
    </MemoryRouter>
  );
}

describe("PublicLandingPage — signed out", () => {
  it("shows the compact public entry with both Create account and Log in", async () => {
    renderLanding();

    expect(
      await screen.findByRole("heading", {
        name: "SynTrack"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Personal Control Center"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Create account"
      })
    ).toHaveAttribute(
      "href",
      "/register"
    );

    expect(
      screen.getByRole("link", {
        name: "Log in"
      })
    ).toHaveAttribute("href", "/login");
  });

  it("explains the product and links to the legal pages, with the Blizzard disclaimer", async () => {
    renderLanding();

    expect(
      await screen.findByRole("heading", {
        name: "What SynTrack does"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/not affiliated with, endorsed, sponsored/)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Impressum" })
    ).toHaveAttribute("href", "/impressum");

    expect(
      screen.getByRole("link", { name: "Datenschutz" })
    ).toHaveAttribute("href", "/datenschutz");
  });
});

describe("PublicLandingPage — signed in", () => {
  it("never shows the Create account / Log in CTAs to an authenticated visitor", async () => {
    localStorage.setItem(
      "syntrack.raiderSessionToken",
      "valid-token"
    );

    vi.mocked(
      getRaiderSessionStatus
    ).mockResolvedValue({
      battleTag: "Demo#1234",
      expiresAt: new Date(
        Date.now() + 60_000
      ).toISOString()
    });

    renderLanding();

    await vi.waitFor(() => {
      expect(
        screen.queryByRole("link", {
          name: "Create account"
        })
      ).not.toBeInTheDocument();
    });

    expect(
      screen.queryByRole("link", {
        name: "Log in"
      })
    ).not.toBeInTheDocument();
  });
});
