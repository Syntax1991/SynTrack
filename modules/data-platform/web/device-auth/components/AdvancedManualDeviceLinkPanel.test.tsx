import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdvancedManualDeviceLinkPanel } from "./AdvancedManualDeviceLinkPanel";

/*
 * The old human-typed-code flow must never be the primary Devices-page
 * UI (product spec: "Settings -> Devices must NOT prominently show
 * Connect a Device / [XXXX-XXXX] / Approve as the primary UI"). Proves
 * it structurally - the manual-code form lives inside a <details>
 * disclosure that is closed by default - rather than just asserting on
 * visual styling, which jsdom does not fully emulate.
 */
describe("AdvancedManualDeviceLinkPanel", () => {
  it("is collapsed by default (the manual-code flow is not open/visible on load)", () => {
    render(
      <AdvancedManualDeviceLinkPanel />
    );

    const disclosure =
      screen
        .getByText(
          "Advanced - Link with a code"
        )
        .closest("details");

    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute(
      "open"
    );
  });

  it("still renders the manual-code form inside the disclosure, for the Advanced/diagnostic path", () => {
    render(
      <AdvancedManualDeviceLinkPanel />
    );

    expect(
      screen.getByRole("heading", {
        name: "Connect a Device"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "XXXX-XXXX"
      )
    ).toBeInTheDocument();
  });
});
