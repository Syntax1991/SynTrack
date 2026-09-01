import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SettingsPage } from "../../../../guild/web/raider-link/pages/SettingsPage";

vi.mock(
  "../../../../data-platform/web/settings/hooks/useSettingsTrust",
  () => ({
    useSettingsTrust: () => ({
      snapshot: {
        account: {
          battleTag: "Syntax#21715",
          status: "signed_in",
          synTrackRosterCount: 22
        },
        battleNet: {
          connectionStatus: "linked",
          battleTag: "Syntax#21715",
          region: "EU",
          discoveredCharacterCount: 24,
          synTrackRosterCount: 22
        },
        wowSync: {
          lastSuccessfulSyncAt:
            "2026-09-01T13:44:30.000Z",
          source: "SynTrack Desktop",
          synTrackRosterCount: 22,
          hasRegisteredDevice: true,
          coreDataReceived: true,
          professionDataReceived: true
        }
      },
      isLoading: false,
      error: null,
      reload: vi.fn()
    })
  })
);

vi.mock(
  "../../../../data-platform/web/device-auth/hooks/useConnectedDevices",
  () => ({
    useConnectedDevices: () => ({
      devices: [],
      isLoading: false,
      error: null,
      revoke: vi.fn()
    })
  })
);

vi.mock(
  "../../../../my-syntrack/web/tags/hooks/useTags",
  () => ({
    useTags: () => ({
      tags: [],
      isLoading: false,
      error: null,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
    })
  })
);

vi.mock(
  "../../../../my-syntrack/web/season/hooks/useTrackerScopeProfiles",
  () => ({
    useTrackerScopeProfiles: () => ({
      profiles: [],
      isLoading: false,
      error: null,
      create: vi.fn(),
      activate: vi.fn()
    })
  })
);

function renderSettingsPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

describe("SettingsPage", () => {
  it("shows the SynTrack account identity without legacy demo copy", () => {
    renderSettingsPage();

    expect(
      screen.getByRole("heading", {
        name: "Syntax#21715"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("SynTrack roster")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/My Raider Login/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(/Demo/i)
    ).not.toBeInTheDocument();
  });

  it("uses WoW Sync instead of WoW Addon", () => {
    renderSettingsPage();

    expect(
      screen.getByRole("tab", {
        name: "WoW Sync"
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("tab", {
        name: "WoW Addon"
      })
    ).not.toBeInTheDocument();
  });

  it("keeps manual SavedVariables import collapsed by default", () => {
    renderSettingsPage();

    fireEvent.click(
      screen.getByRole("tab", {
        name: "WoW Sync"
      })
    );

    const disclosure =
      screen
        .getByText(
          /Advanced — Manual SavedVariables import/i
        )
        .closest("details");

    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute(
      "open"
    );
  });

  it("shows Battle.net trust state without the legacy primary Load my characters button", () => {
    renderSettingsPage();

    fireEvent.click(
      screen.getByRole("tab", {
        name: "Battle.net"
      })
    );

    expect(
      screen.getAllByText("Linked").length
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("button", {
        name: "Refresh Battle.net characters"
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Load my characters"
      })
    ).not.toBeInTheDocument();
  });

  it("shows WoW sync trust without claiming connected presence", () => {
    renderSettingsPage();

    fireEvent.click(
      screen.getByRole("tab", {
        name: "WoW Sync"
      })
    );

    expect(
      screen.getByText("Last successful sync")
    ).toBeInTheDocument();

    expect(
      screen.getByText("SynTrack Desktop")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/Connected/i)
    ).not.toBeInTheDocument();
  });
});
