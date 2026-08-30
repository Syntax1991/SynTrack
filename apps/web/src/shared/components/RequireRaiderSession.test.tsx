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
import { RequireRaiderSession } from "./RequireRaiderSession";

vi.mock(
  "../../../../../modules/data-platform/web/raider-auth/api/raiderAuthApi",
  () => ({
    getRaiderSessionStatus: vi.fn()
  })
);

import { getRaiderSessionStatus } from "../../../../../modules/data-platform/web/raider-auth/api/raiderAuthApi";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderGate(initialPath: string) {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
    >
      <Routes>
        <Route
          element={<div>Login page</div>}
          path="/login"
        />

        <Route
          element={
            <RequireRaiderSession>
              <div>Protected content</div>
            </RequireRaiderSession>
          }
          path="*"
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireRaiderSession — signed out", () => {
  it("shows the public landing page in place at the app root, not a redirect", async () => {
    renderGate("/");

    expect(
      await screen.findByRole("heading", {
        name: "SynTrack"
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Protected content"
      )
    ).not.toBeInTheDocument();
  });

  it("redirects a protected route to /login with a safe returnTo, preserving the originally requested path", async () => {
    renderGate("/characters");

    expect(
      await screen.findByText("Login page")
    ).toBeInTheDocument();
  });
});

describe("RequireRaiderSession — signed in", () => {
  it("renders the protected content once a valid session is confirmed", async () => {
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

    renderGate("/characters");

    expect(
      await screen.findByText(
        "Protected content"
      )
    ).toBeInTheDocument();
  });
});
