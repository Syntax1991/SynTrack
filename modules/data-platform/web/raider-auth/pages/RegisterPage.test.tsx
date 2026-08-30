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
import { RegisterPage } from "./RegisterPage";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderRegister(
  path = "/register"
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe("RegisterPage — default state", () => {
  it("renders the account-creation copy with a Register with Battle.net action", async () => {
    renderRegister();

    expect(
      await screen.findByRole("heading", {
        name: "Create your SynTrack account"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Track your characters, weekly progression and professions/
      )
    ).toBeInTheDocument();

    const registerLink = screen.getByRole(
      "link",
      {
        name: "Register with Battle.net"
      }
    );

    expect(
      registerLink.getAttribute("href")
    ).toContain(
      "/auth/raider/connect"
    );

    expect(
      registerLink.getAttribute("href")
    ).toContain("intent=register");
  });

  it("offers a link back to login for existing users", async () => {
    renderRegister();

    expect(
      await screen.findByRole("link", {
        name: "Log in"
      })
    ).toHaveAttribute("href", "/login");
  });
});

describe("RegisterPage — error outcome", () => {
  it("shows a generic failure message, never a raw backend error string", async () => {
    renderRegister(
      "/register?error=ECONNRESET%20raw%20socket%20failure"
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
    renderRegister(
      "/register?error=state_expired"
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
      screen.getByRole("link", {
        name: "Try again"
      })
    ).toHaveAttribute("href", "/register");
  });
});
