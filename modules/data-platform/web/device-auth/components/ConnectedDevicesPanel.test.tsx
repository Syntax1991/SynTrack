import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedDevicesPanel } from "./ConnectedDevicesPanel";

vi.mock("../api/deviceAuthApi", () => ({
  listDevices: vi.fn(),
  revokeDevice: vi.fn()
}));

import {
  listDevices,
  revokeDevice
} from "../api/deviceAuthApi";

afterEach(() => {
  vi.clearAllMocks();
});

/*
 * Confirms the Devices management page's core job: list connected
 * devices and let the user revoke one, server-authoritatively (revoke is
 * a real API call, not a client-only "hide from view").
 */
describe("ConnectedDevicesPanel", () => {
  it("lists connected devices with their last-synced state", async () => {
    vi.mocked(listDevices).mockResolvedValue(
      {
        items: [
          {
            id: "device-1",
            name: "GAMING-PC",
            createdAt:
              "2026-08-01T00:00:00.000Z",
            lastSeenAt:
              "2026-08-30T12:00:00.000Z",
            revokedAt: null
          }
        ]
      }
    );

    render(<ConnectedDevicesPanel />);

    expect(
      await screen.findByText(
        /GAMING-PC/u
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Revoke"
      })
    ).toBeInTheDocument();
  });

  it("revoking a device calls the server-authoritative revoke endpoint and reflects the result", async () => {
    vi.mocked(listDevices)
      .mockResolvedValueOnce({
        items: [
          {
            id: "device-1",
            name: "GAMING-PC",
            createdAt:
              "2026-08-01T00:00:00.000Z",
            lastSeenAt: null,
            revokedAt: null
          }
        ]
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "device-1",
            name: "GAMING-PC",
            createdAt:
              "2026-08-01T00:00:00.000Z",
            lastSeenAt: null,
            revokedAt:
              "2026-08-31T00:00:00.000Z"
          }
        ]
      });

    vi.mocked(
      revokeDevice
    ).mockResolvedValue({
      id: "device-1",
      name: "GAMING-PC",
      createdAt:
        "2026-08-01T00:00:00.000Z",
      lastSeenAt: null,
      revokedAt:
        "2026-08-31T00:00:00.000Z"
    });

    render(<ConnectedDevicesPanel />);

    const revokeButton =
      await screen.findByRole(
        "button",
        { name: "Revoke" }
      );

    fireEvent.click(revokeButton);

    expect(revokeDevice).toHaveBeenCalledWith(
      "device-1"
    );

    expect(
      await screen.findByText("Revoked")
    ).toBeInTheDocument();
  });

  it("shows an empty state when no devices are connected", async () => {
    vi.mocked(listDevices).mockResolvedValue(
      { items: [] }
    );

    render(<ConnectedDevicesPanel />);

    expect(
      await screen.findByText(
        "No devices connected yet."
      )
    ).toBeInTheDocument();
  });
});
