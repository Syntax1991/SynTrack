import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BattleNetSettingsPanel } from "./BattleNetSettingsPanel";

vi.mock("../hooks/useSettingsTrust", () => ({
  useSettingsTrust: () => ({
    snapshot: {
      account: {
        battleTag: "Syntax#21715",
        status: "signed_in",
        synTrackRosterCount: 22
      },
      battleNet: {
        connectionStatus: "reconnect_required",
        battleTag: "Syntax#21715",
        region: "EU",
        discoveredCharacterCount: null,
        synTrackRosterCount: 22
      },
      wowSync: {
        lastSuccessfulSyncAt: null,
        source: null,
        synTrackRosterCount: 22,
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

describe("BattleNetSettingsPanel", () => {
  it("shows reconnect state without implying the SynTrack account is signed out", () => {
    render(<BattleNetSettingsPanel />);

    expect(
      screen.getAllByText("Reconnect required").length
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("link", {
        name: "Reconnect Battle.net"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/SynTrack account stays signed in/i)
    ).toBeInTheDocument();
  });
});
