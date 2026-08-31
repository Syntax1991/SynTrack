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
import { ClientConnectPage } from "./ClientConnectPage";

vi.mock("../api/deviceConnectApi", () => ({
  previewDeviceConnection: vi.fn(),
  bindDeviceConnection: vi.fn()
}));

vi.mock(
  "../../raider-auth/api/raiderAuthApi",
  () => ({
    getRaiderSessionStatus: vi.fn(),
    getRaiderLoginUrl: (
      options?: Record<string, unknown>
    ) => {
      const params = new URLSearchParams();

      if (options?.intent === "register") {
        params.set("intent", "register");
      }

      if (options?.returnTo) {
        params.set(
          "returnTo",
          String(options.returnTo)
        );
      }

      if (options?.deviceConnectionToken) {
        params.set(
          "deviceConnectionToken",
          String(
            options.deviceConnectionToken
          )
        );
      }

      return `/auth/raider/connect?${params.toString()}`;
    }
  })
);

import {
  bindDeviceConnection,
  previewDeviceConnection
} from "../api/deviceConnectApi";
import { getRaiderSessionStatus } from "../../raider-auth/api/raiderAuthApi";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderConnect(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ClientConnectPage />
    </MemoryRouter>
  );
}

describe("ClientConnectPage — signed out", () => {
  it("shows a 'Continue with Battle.net' action for a valid pending connection while signed out, and never calls bind", async () => {
    vi.mocked(
      previewDeviceConnection
    ).mockResolvedValue({
      status: "PENDING",
      deviceName: "GAMING-PC"
    });

    renderConnect(
      "/client/connect?token=abc123"
    );

    expect(
      await screen.findByRole("link", {
        name: "Continue with Battle.net"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /GAMING-PC/u
      )
    ).toBeInTheDocument();

    expect(
      bindDeviceConnection
    ).not.toHaveBeenCalled();
  });

  it("carries the browser token through to the Battle.net connect URL, using register intent (so an unknown account can register in the same click)", async () => {
    vi.mocked(
      previewDeviceConnection
    ).mockResolvedValue({
      status: "PENDING",
      deviceName: null
    });

    renderConnect(
      "/client/connect?token=abc123"
    );

    const link =
      await screen.findByRole("link", {
        name: "Continue with Battle.net"
      });

    expect(
      link.getAttribute("href")
    ).toContain(
      "deviceConnectionToken=abc123"
    );

    expect(
      link.getAttribute("href")
    ).toContain("intent=register");
  });
});

describe("ClientConnectPage — signed in", () => {
  it("auto-binds without any extra click when the browser already has a valid session", async () => {
    localStorage.setItem(
      "syntrack.raiderSessionToken",
      "existing-session-token"
    );

    vi.mocked(
      getRaiderSessionStatus
    ).mockResolvedValue({
      battleTag: "Syntax#21715",
      expiresAt: new Date(
        Date.now() + 100000
      ).toISOString()
    });

    vi.mocked(
      previewDeviceConnection
    ).mockResolvedValue({
      status: "PENDING",
      deviceName: "GAMING-PC"
    });

    vi.mocked(
      bindDeviceConnection
    ).mockResolvedValue({
      status: "CONNECTED",
      deviceName: "GAMING-PC",
      connectedBattleTag:
        "Syntax#21715"
    });

    renderConnect(
      "/client/connect?token=abc123"
    );

    expect(
      await screen.findByRole(
        "heading",
        {
          name: "SynTrack Client connected"
        }
      )
    ).toBeInTheDocument();

    expect(
      bindDeviceConnection
    ).toHaveBeenCalledWith("abc123");

    expect(
      screen.getByText(
        /Connected to Syntax#21715/u
      )
    ).toBeInTheDocument();
  });
});

describe("ClientConnectPage — terminal states", () => {
  it("shows the expired-state copy and no action button", async () => {
    vi.mocked(
      previewDeviceConnection
    ).mockResolvedValue({
      status: "EXPIRED"
    });

    renderConnect(
      "/client/connect?token=abc123"
    );

    expect(
      await screen.findByText(
        "This connection request has expired. Return to the SynTrack desktop app and try again."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "Continue with Battle.net"
      })
    ).not.toBeInTheDocument();
  });

  it("shows the invalid-state copy for an unknown token", async () => {
    vi.mocked(
      previewDeviceConnection
    ).mockResolvedValue({
      status: "INVALID"
    });

    renderConnect(
      "/client/connect?token=does-not-exist"
    );

    expect(
      await screen.findByText(
        "This connection request is no longer valid."
      )
    ).toBeInTheDocument();
  });

  it("shows the invalid state immediately when the page is opened with no token at all", async () => {
    renderConnect("/client/connect");

    expect(
      await screen.findByText(
        "This connection request is no longer valid."
      )
    ).toBeInTheDocument();

    expect(
      previewDeviceConnection
    ).not.toHaveBeenCalled();
  });
});
