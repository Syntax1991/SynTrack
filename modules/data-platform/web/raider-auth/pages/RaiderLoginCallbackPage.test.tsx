import { render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes
} from "react-router-dom";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { RaiderLoginCallbackPage } from "./RaiderLoginCallbackPage";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderCallback(
  path: string,
  hash: string
) {
  window.location.hash = hash;

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          element={
            <RaiderLoginCallbackPage />
          }
          path="/raider-login"
        />

        <Route
          element={<div>Overview page</div>}
          path="/"
        />

        <Route
          element={
            <div>Characters page</div>
          }
          path="/characters"
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("RaiderLoginCallbackPage — safe return destination", () => {
  it("restores the originally requested page after a successful login", async () => {
    renderCallback(
      "/raider-login?returnTo=%2Fcharacters",
      "#token=session-token"
    );

    expect(
      await screen.findByText(
        "Characters page"
      )
    ).toBeInTheDocument();
  });

  it("defaults to Overview when no returnTo is present", async () => {
    renderCallback(
      "/raider-login",
      "#token=session-token"
    );

    expect(
      await screen.findByText(
        "Overview page"
      )
    ).toBeInTheDocument();
  });

  it("ignores an unsafe (external) returnTo and falls back to Overview", async () => {
    renderCallback(
      "/raider-login?returnTo=https%3A%2F%2Fevil.example.com",
      "#token=session-token"
    );

    expect(
      await screen.findByText(
        "Overview page"
      )
    ).toBeInTheDocument();
  });

  it("stores the session token from the hash so subsequent requests are authenticated", async () => {
    renderCallback(
      "/raider-login",
      "#token=session-token-xyz"
    );

    await screen.findByText(
      "Overview page"
    );

    expect(
      localStorage.getItem(
        "syntrack.raiderSessionToken"
      )
    ).toBe("session-token-xyz");
  });
});

describe("RaiderLoginCallbackPage — error state", () => {
  it("shows the error message when no token is present", async () => {
    renderCallback(
      "/raider-login?error=Something%20failed",
      ""
    );

    expect(
      await screen.findByText(
        "Something failed"
      )
    ).toBeInTheDocument();
  });
});
