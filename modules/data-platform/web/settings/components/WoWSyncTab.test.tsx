import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WoWSyncTab } from "./WoWSyncTab";

vi.mock("../hooks/useSettingsTrust", () => ({
  useSettingsTrust: () => ({
    snapshot: {
      account: {
        battleTag: "Syntax#21715",
        status: "signed_in",
        synTrackRosterCount: 0
      },
      battleNet: {
        connectionStatus: "linked",
        battleTag: "Syntax#21715",
        region: "EU",
        discoveredCharacterCount: 0,
        synTrackRosterCount: 0
      },
      wowSync: {
        lastSuccessfulSyncAt: null,
        source: null,
        synTrackRosterCount: 0,
        hasRegisteredDevice: false,
        coreDataReceived: false,
        professionDataReceived: false
      }
    },
    isLoading: false,
    error: null,
    reload: vi.fn()
  })
}));

describe("WoWSyncTab", () => {
  it("shows a truthful empty sync state", () => {
    render(<WoWSyncTab />);

    expect(
      screen.getByText("Never")
    ).toBeInTheDocument();

    expect(
      screen.getByText("No recent sync")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/Connected/i)
    ).not.toBeInTheDocument();
  });
});
