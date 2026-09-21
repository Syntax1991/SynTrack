import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WowClassIcon } from "./WowClassIcon";
import { WowMediaIconsContext } from "../wow-media/useWowMediaIcons";

describe("WowClassIcon", () => {
  it("falls back to class initials when no media URL is available", () => {
    render(<WowClassIcon wowClassName="Death Knight" />);

    expect(screen.getByTitle("Death Knight")).toHaveTextContent("DK");
    expect(
      document.querySelector("img.wow-media-icon")
    ).not.toBeInTheDocument();
  });

  it("renders the Blizzard media URL for a canonical class name", () => {
    render(
      <WowMediaIconsContext.Provider
        value={{
          classes: {
            Shaman:
              "https://render.worldofwarcraft.com/icons/56/classicon_shaman.jpg"
          },
          professions: {}
        }}
      >
        <WowClassIcon wowClassName="Shaman" />
      </WowMediaIconsContext.Provider>
    );

    expect(screen.getByTitle("Shaman")).toHaveAttribute(
      "src",
      "https://render.worldofwarcraft.com/icons/56/classicon_shaman.jpg"
    );
  });

  it("does not invent an icon from an unknown class name", () => {
    render(
      <WowMediaIconsContext.Provider
        value={{
          classes: {
            Shaman:
              "https://render.worldofwarcraft.com/icons/56/classicon_shaman.jpg"
          },
          professions: {}
        }}
      >
        <WowClassIcon wowClassName="Schamane" />
      </WowMediaIconsContext.Provider>
    );

    expect(screen.getByTitle("Schamane")).toHaveTextContent("S");
    expect(
      document.querySelector("img.wow-media-icon")
    ).not.toBeInTheDocument();
  });
});
