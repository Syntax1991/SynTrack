import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppNavigation } from "./AppNavigation";

/*
 * Phase 1 rendered navigation verification. The real app gates
 * AppNavigation behind RequireRaiderSession (Battle.net OAuth), which
 * cannot be driven in an automated/headless check - this test renders
 * AppNavigation directly, the same real component and real
 * mainModules/moduleTypes data the authenticated app uses, so it is a
 * genuine DOM-level proof of the sidebar shape rather than a data-only
 * assertion. RaiderAuthTopAction reads no session token in this
 * environment and safely renders its signed-out state without any
 * network call.
 */
function renderNavigation(
  initialPath = "/"
) {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
    >
      <AppNavigation />
    </MemoryRouter>
  );
}

describe("AppNavigation - Phase 1 personal control center sidebar", () => {
  it("shows My SynTrack with Professions nested inside it, never as its own top-level module", () => {
    renderNavigation();

    expect(
      screen.getByRole("button", {
        name: /My SynTrack/i
      })
    ).toBeInTheDocument();

    const professionsLabels =
      screen.getAllByText(
        "Professions"
      );

    expect(
      professionsLabels
    ).toHaveLength(1);

    expect(
      screen.getByText("Find Craft")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Specializations"
      )
    ).toBeInTheDocument();
  });

  it("never shows Guild, Loot, Recruitment or Raid Tasks in the sidebar", () => {
    renderNavigation();

    expect(
      screen.queryByText("Guild")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Loot")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        "Recruitment"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(
        "Raid Tasks"
      )
    ).not.toBeInTheDocument();
  });

  it("labels the gear entry 'Gear' and shows exactly one Settings entry", () => {
    renderNavigation();

    expect(
      screen.getByText("Gear")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Gear / Enchants / Gems"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.getAllByText("Settings")
    ).toHaveLength(1);
  });

  it("highlights the nested Find Craft link as active when the current route is a profession sub-route, and keeps My SynTrack expanded", () => {
    renderNavigation(
      "/professions/crafters"
    );

    const findCraftLink =
      screen.getByRole("link", {
        name: "Find Craft"
      });

    expect(
      findCraftLink
    ).toHaveClass("active");

    const mySynTrackToggle =
      screen.getByRole("button", {
        name: /My SynTrack/i
      });

    expect(
      mySynTrackToggle
    ).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("renders Overview, Characters, Weekly Checklist and Vault / M+ as direct My SynTrack items alongside the nested Professions group", () => {
    renderNavigation();

    const sidebar = screen.getByRole(
      "complementary",
      {
        name: "SynTrack navigation"
      }
    );

    const withinSidebar = within(
      sidebar
    );

    expect(
      withinSidebar.getByText(
        "My Characters"
      )
    ).toBeInTheDocument();

    expect(
      withinSidebar.getByText(
        "Weekly Checklist"
      )
    ).toBeInTheDocument();

    expect(
      withinSidebar.getByText(
        "Vault / M+"
      )
    ).toBeInTheDocument();
  });
});
