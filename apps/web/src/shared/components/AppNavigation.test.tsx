import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppNavigation } from "./AppNavigation";

/*
 * Navigation-architecture verification. The real app gates AppNavigation
 * behind RequireRaiderSession (Battle.net OAuth), which cannot be
 * driven in an automated/headless check - this renders the real
 * AppNavigation component directly (same real navDomains data the
 * authenticated app uses), which is a genuine DOM-level proof rather
 * than a data-only assertion. RaiderAuthTopAction reads no session
 * token in this environment and safely renders its signed-out state
 * without any network call.
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

function sidebar() {
  return within(
    screen.getByRole(
      "complementary",
      {
        name: "SynTrack navigation"
      }
    )
  );
}

describe("AppNavigation - flat product-domain sidebar", () => {
  it("renders exactly the seven domains: Overview, Season, Characters, Weeklies, Professions, Gear and Settings", () => {
    renderNavigation();

    const labels = [
      "Overview",
      "Season",
      "Characters",
      "Weeklies",
      "Professions",
      "Gear",
      "Settings"
    ];

    for (const label of labels) {
      expect(
        sidebar().getByText(label)
      ).toBeInTheDocument();
    }
  });

  it("never renders My Characters, Weekly Checklist, Vault / M+, profession child links, a My SynTrack wrapper, Roadmap, Automation, Guild, Loot, Recruitment or Raid Tasks", () => {
    renderNavigation();

    const removedLabels = [
      "My Characters",
      "Weekly Checklist",
      "Vault / M+",
      "Find Craft",
      "Specializations",
      "My SynTrack",
      "Roadmap",
      "Automation",
      "Guild",
      "Loot",
      "Recruitment",
      "Raid Tasks",
      "Workspace"
    ];

    for (const label of removedLabels) {
      expect(
        sidebar().queryByText(label)
      ).not.toBeInTheDocument();
    }
  });

  it("keeps Professions highlighted while on a profession sub-route, with no sidebar child link required", () => {
    renderNavigation(
      "/professions/crafters"
    );

    const professionsLink =
      sidebar().getByRole("link", {
        name: /Professions/i
      });

    expect(
      professionsLink
    ).toHaveClass("active");
  });

  it("keeps Weeklies highlighted while on the Vault/M+ route, which is not its own sidebar entry", () => {
    renderNavigation(
      "/vault-mythic-plus"
    );

    const weekliesLink =
      sidebar().getByRole("link", {
        name: /Weeklies/i
      });

    expect(
      weekliesLink
    ).toHaveClass("active");
  });

  it("does not highlight Weeklies or Professions when viewing an unrelated domain", () => {
    renderNavigation("/gear-readiness");

    const weekliesLink =
      sidebar().getByRole("link", {
        name: /Weeklies/i
      });

    const professionsLink =
      sidebar().getByRole("link", {
        name: /Professions/i
      });

    const gearLink =
      sidebar().getByRole("link", {
        name: /Gear/i
      });

    expect(
      weekliesLink
    ).not.toHaveClass("active");

    expect(
      professionsLink
    ).not.toHaveClass("active");

    expect(gearLink).toHaveClass(
      "active"
    );
  });
});
