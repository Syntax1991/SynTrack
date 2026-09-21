import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WowProfessionIcon } from "./WowProfessionIcon";
import { WowMediaIconsContext } from "../wow-media/useWowMediaIcons";

describe("WowProfessionIcon", () => {
  it("falls back to a two-letter glyph when no media URL is available", () => {
    render(
      <WowProfessionIcon name="Alchemy" professionKey="alchemy" />
    );

    expect(screen.getByTitle("Alchemy")).toHaveTextContent("AL");
    expect(
      document.querySelector("img.wow-media-icon")
    ).not.toBeInTheDocument();
  });

  it("renders the Blizzard media URL keyed by profession catalog key", () => {
    render(
      <WowMediaIconsContext.Provider
        value={{
          classes: {},
          professions: {
            alchemy:
              "https://render.worldofwarcraft.com/icons/56/trade_alchemy.jpg"
          }
        }}
      >
        <WowProfessionIcon name="Alchemy" professionKey="alchemy" />
      </WowMediaIconsContext.Provider>
    );

    expect(screen.getByTitle("Alchemy")).toHaveAttribute(
      "src",
      "https://render.worldofwarcraft.com/icons/56/trade_alchemy.jpg"
    );
  });

  it("does not look up a profession by localized display name", () => {
    render(
      <WowMediaIconsContext.Provider
        value={{
          classes: {},
          professions: {
            alchemy:
              "https://render.worldofwarcraft.com/icons/56/trade_alchemy.jpg"
          }
        }}
      >
        <WowProfessionIcon name="Alchemy" professionKey="Alchemie" />
      </WowMediaIconsContext.Provider>
    );

    expect(screen.getByTitle("Alchemy")).toHaveTextContent("AL");
    expect(
      document.querySelector("img.wow-media-icon")
    ).not.toBeInTheDocument();
  });
});
