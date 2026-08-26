import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SynTrackTooltip } from "./SynTrackTooltip";

/*
 * jsdom does not perform real layout (getBoundingClientRect always
 * returns zeros), so these tests cannot prove pixel-perfect placement
 * in a real browser - that is what tooltipPlacement.test.ts's pure
 * function tests are for, plus your own authenticated visual review.
 * What IS verified here, with real rendered output: the tooltip
 * portals out of its anchor's DOM subtree (so it can never be clipped
 * by a scrolling ancestor), and it opens/closes on every required
 * trigger (hover, focus, Escape).
 */
describe("SynTrackTooltip", () => {
  it("portals its content to document.body, not nested inside the anchor's own DOM subtree", () => {
    const { container } = render(
      <div
        data-testid="scroll-container"
        style={{
          overflow: "auto"
        }}
      >
        <SynTrackTooltip
          content={
            <span>
              Tooltip body
            </span>
          }
        >
          <button type="button">
            Trigger
          </button>
        </SynTrackTooltip>
      </div>
    );

    fireEvent.mouseEnter(
      screen.getByText("Trigger")
    );

    const tooltipContent =
      screen.getByRole("tooltip");

    expect(
      container.contains(
        tooltipContent
      )
    ).toBe(false);

    expect(
      document.body.contains(
        tooltipContent
      )
    ).toBe(true);
  });

  it("opens on hover and closes on mouse leave", () => {
    render(
      <SynTrackTooltip
        content={
          <span>Tooltip body</span>
        }
      >
        <button type="button">
          Trigger
        </button>
      </SynTrackTooltip>
    );

    expect(
      screen.queryByRole(
        "tooltip"
      )
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(
      screen.getByText("Trigger")
    );

    expect(
      screen.getByRole("tooltip")
    ).toBeInTheDocument();

    fireEvent.mouseLeave(
      screen.getByText("Trigger")
    );

    expect(
      screen.queryByRole(
        "tooltip"
      )
    ).not.toBeInTheDocument();
  });

  it("opens on keyboard focus and closes on blur - not hover-only", () => {
    render(
      <SynTrackTooltip
        content={
          <span>Tooltip body</span>
        }
      >
        <button type="button">
          Trigger
        </button>
      </SynTrackTooltip>
    );

    fireEvent.focus(
      screen.getByText("Trigger")
    );

    expect(
      screen.getByRole("tooltip")
    ).toBeInTheDocument();

    fireEvent.blur(
      screen.getByText("Trigger")
    );

    expect(
      screen.queryByRole(
        "tooltip"
      )
    ).not.toBeInTheDocument();
  });

  it("closes on Escape while open via keyboard focus", () => {
    render(
      <SynTrackTooltip
        content={
          <span>Tooltip body</span>
        }
      >
        <button type="button">
          Trigger
        </button>
      </SynTrackTooltip>
    );

    fireEvent.focus(
      screen.getByText("Trigger")
    );

    expect(
      screen.getByRole("tooltip")
    ).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByText("Trigger"),
      { key: "Escape" }
    );

    expect(
      screen.queryByRole(
        "tooltip"
      )
    ).not.toBeInTheDocument();
  });

  it("renders the passed content once open", () => {
    render(
      <SynTrackTooltip
        content={
          <span>
            Balanced Bracers 15/20
          </span>
        }
      >
        <button type="button">
          Trigger
        </button>
      </SynTrackTooltip>
    );

    fireEvent.mouseEnter(
      screen.getByText("Trigger")
    );

    expect(
      screen.getByText(
        "Balanced Bracers 15/20"
      )
    ).toBeInTheDocument();
  });
});
