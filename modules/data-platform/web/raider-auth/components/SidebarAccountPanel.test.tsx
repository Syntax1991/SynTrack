import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarAccountPanel } from "./SidebarAccountPanel";
import * as raiderAuthApi from "../api/raiderAuthApi";
import {
  clearRaiderSessionToken,
  setRaiderSessionToken
} from "../../../../../apps/web/src/shared/api/raiderSession";

describe("SidebarAccountPanel", () => {
  afterEach(() => {
    clearRaiderSessionToken();
    vi.restoreAllMocks();
  });

  it("renders nothing when there is no session token (avoids a flash of empty account UI)", () => {
    const { container } = render(<SidebarAccountPanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the real BattleTag and a deterministic initial — never a fabricated avatar image", async () => {
    setRaiderSessionToken("token");
    vi.spyOn(raiderAuthApi, "getRaiderSessionStatus").mockResolvedValue({
      battleTag: "Syntax#21715",
      expiresAt: "2026-12-31T00:00:00.000Z"
    });

    render(<SidebarAccountPanel />);

    await waitFor(() => {
      expect(screen.getByText("Syntax#21715")).toBeInTheDocument();
    });
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });
});
