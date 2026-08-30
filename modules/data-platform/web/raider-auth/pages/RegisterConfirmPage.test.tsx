import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { RegisterConfirmPage } from "./RegisterConfirmPage";

vi.mock("../api/raiderAuthApi", () => ({
  getPendingRegistration: vi.fn(),
  confirmRegistration: vi.fn()
}));

import {
  confirmRegistration,
  getPendingRegistration
} from "../api/raiderAuthApi";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(
    null,
    "",
    "/register/confirm"
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderConfirm(hash: string) {
  window.location.hash = hash;

  return render(
    <MemoryRouter
      initialEntries={[
        `/register/confirm${hash}`
      ]}
    >
      <RegisterConfirmPage />
    </MemoryRouter>
  );
}

describe("RegisterConfirmPage — new identity (pendingToken)", () => {
  it("shows the authenticated BattleTag and a Create account action before anything is persisted", async () => {
    vi.mocked(
      getPendingRegistration
    ).mockResolvedValue({
      battleTag: "Syntax#21715"
    });

    renderConfirm("#pendingToken=abc123");

    expect(
      await screen.findByRole("heading", {
        name: "Create SynTrack account"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Battle.net account")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Syntax#21715")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Create account"
      })
    ).toBeInTheDocument();

    expect(
      confirmRegistration
    ).not.toHaveBeenCalled();
  });

  it("only calls confirmRegistration once the user explicitly clicks Create account", async () => {
    vi.mocked(
      getPendingRegistration
    ).mockResolvedValue({
      battleTag: "Syntax#21715"
    });

    vi.mocked(
      confirmRegistration
    ).mockResolvedValue({
      token: "session-token",
      raiderAccountId: "account-1",
      characters: []
    });

    renderConfirm("#pendingToken=abc123");

    const createButton =
      await screen.findByRole("button", {
        name: "Create account"
      });

    fireEvent.click(createButton);

    expect(
      confirmRegistration
    ).toHaveBeenCalledWith("abc123");
  });
});

describe("RegisterConfirmPage — identity already has an account", () => {
  it("shows the already-registered message instead of a Create account button", async () => {
    renderConfirm("#token=existing-session-token");

    expect(
      await screen.findByRole("heading", {
        name: "You already have a SynTrack account"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Continue to SynTrack"
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Create account"
      })
    ).not.toBeInTheDocument();
  });
});

describe("RegisterConfirmPage — error state", () => {
  it("shows a generic failure message when the pending registration cannot be found", async () => {
    vi.mocked(
      getPendingRegistration
    ).mockRejectedValue(
      new Error(
        "raw backend detail that must never reach the user"
      )
    );

    renderConfirm("#pendingToken=expired-token");

    expect(
      await screen.findByText(
        "Could not sign in with Battle.net."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        /raw backend detail/
      )
    ).not.toBeInTheDocument();
  });

  it("shows a generic failure message when neither token nor pendingToken is present", async () => {
    renderConfirm("");

    expect(
      await screen.findByText(
        "Could not sign in with Battle.net."
      )
    ).toBeInTheDocument();
  });
});
