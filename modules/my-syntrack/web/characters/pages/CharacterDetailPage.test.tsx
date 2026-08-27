import { screen } from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  buildDetail,
  renderCharacterDetailRoute
} from "./characterDetailTestHelpers";

const mocks = vi.hoisted(() => ({
  useCharacterControlDetail:
    vi.fn()
}));

vi.mock(
  "../hooks/useCharacterControlDetail",
  () => ({
    useCharacterControlDetail:
      mocks.useCharacterControlDetail
  })
);

const { CharacterDetailPage } =
  await import(
    "./CharacterDetailPage"
  );

function renderPage() {
  return renderCharacterDetailRoute(
    <CharacterDetailPage />
  );
}

describe("CharacterDetailPage", () => {
  beforeEach(() => {
    mocks.useCharacterControlDetail
      .mockReturnValue({
        detail: buildDetail(),
        isLoading: false,
        error: null,
        notFound: false
      });
  });

  it("renders only the requested character's aggregated state", () => {
    renderPage();

    expect(
      mocks.useCharacterControlDetail
    ).toHaveBeenCalledWith("char-2");

    expect(
      screen.getByRole("heading", {
        name: "Synbloom"
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Synblast")
    ).not.toBeInTheDocument();

    expect(
      screen.getAllByText("3/5")
        .length
    ).toBeGreaterThan(0);

    expect(
      screen.getByText("Alchemy")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Skill 100 · 42 KP"
      )
    ).toBeInTheDocument();
  });

  it("keeps Vault unknown, Gear not tracked, and explicit false tracker distinct", () => {
    renderPage();

    expect(
      screen.getByTitle(
        /Vault state unknown/
      )
    ).toHaveTextContent("?");

    expect(
      screen.getByTitle(
        "Gear not tracked"
      )
    ).toHaveTextContent("—");

    expect(
      screen.getByTitle(
        "Explicitly incomplete"
      )
    ).toHaveTextContent("○");

    expect(
      screen.getByTitle(
        "Not recorded yet"
      )
    ).toHaveTextContent("?");
  });

  it("links to existing domain routes and preserves the character id for specializations", () => {
    renderPage();

    expect(
      screen.getByRole("link", {
        name: "Open profession"
      })
    ).toHaveAttribute(
      "href",
      "/professions/profession-alchemy"
    );

    expect(
      screen.getByRole("link", {
        name: "Specializations"
      })
    ).toHaveAttribute(
      "href",
      "/professions/specializations?profession=profession-alchemy&character=char-2"
    );

    expect(
      screen.getAllByRole("link")
        .some(
          (link) =>
            link.getAttribute(
              "href"
            ) ===
            "/gear-readiness"
        )
    ).toBe(true);
  });
});
