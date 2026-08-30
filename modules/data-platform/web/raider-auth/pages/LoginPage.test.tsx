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
import { LoginPage } from "./LoginPage";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderLogin(path = "/login") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage — default state", () => {
  it("renders Welcome back with a Continue with Battle.net action", async () => {
    renderLogin();

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Sign in to your SynTrack account."
      )
    ).toBeInTheDocument();

    const continueLink = screen.getByRole(
      "link",
      {
        name: "Continue with Battle.net"
      }
    );

    expect(
      continueLink.getAttribute("href")
    ).toContain(
      "/auth/raider/connect"
    );

    expect(
      continueLink.getAttribute("href")
    ).not.toContain("intent=register");
  });

  it("offers a link to registration for new users", async () => {
    renderLogin();

    expect(
      await screen.findByRole("link", {
        name: "Create account"
      })
    ).toHaveAttribute(
      "href",
      "/register"
    );
  });

  it("carries a safe returnTo through to the Battle.net connect URL", async () => {
    renderLogin(
      "/login?returnTo=%2Fcharacters"
    );

    const continueLink =
      await screen.findByRole("link", {
        name: "Continue with Battle.net"
      });

    expect(
      continueLink.getAttribute("href")
    ).toContain(
      "returnTo=%2Fcharacters"
    );
  });

  it("drops an unsafe returnTo (external URL) instead of forwarding it", async () => {
    renderLogin(
      "/login?returnTo=https%3A%2F%2Fevil.example.com"
    );

    const continueLink =
      await screen.findByRole("link", {
        name: "Continue with Battle.net"
      });

    expect(
      continueLink.getAttribute("href")
    ).not.toContain("evil.example.com");
  });
});

describe("LoginPage — unknown-account outcome", () => {
  it("shows the no-account message with a link to registration, never auto-creating anything", async () => {
    renderLogin(
      "/login?outcome=unknown-account"
    );

    expect(
      await screen.findByText(
        /No SynTrack account exists for this Battle\.net account\./
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
  });
});

describe("LoginPage — error outcome", () => {
  it("shows a generic failure message, never a raw backend error string", async () => {
    renderLogin(
      "/login?error=ECONNRESET%20raw%20socket%20failure"
    );

    expect(
      await screen.findByText(
        "Could not sign in with Battle.net."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/ECONNRESET/)
    ).not.toBeInTheDocument();
  });

  it("shows a distinct message for an expired/invalid OAuth state, not the generic failure copy", async () => {
    renderLogin(
      "/login?error=state_expired"
    );

    expect(
      await screen.findByRole("heading", {
        name: "Sign-in expired"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Battle\.net sign-in expired or could not be verified/u
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Could not sign in with Battle.net."
      )
    ).not.toBeInTheDocument();

    // "Try again" must start a brand-new flow, never resubmit the dead
    // state - it links to a fresh /login, not back to the same URL.
    expect(
      screen.getByRole("link", {
        name: "Try again"
      })
    ).toHaveAttribute("href", "/login");
  });
});
