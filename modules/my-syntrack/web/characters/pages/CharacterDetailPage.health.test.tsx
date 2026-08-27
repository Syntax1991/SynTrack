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

describe("CharacterDetailPage - tags, data health, and not-found", () => {
  beforeEach(() => {
    mocks.useCharacterControlDetail
      .mockReturnValue({
        detail: buildDetail(),
        isLoading: false,
        error: null,
        notFound: false
      });
  });

  it("renders an explicit Not Found state for an invalid character id", () => {
    mocks.useCharacterControlDetail
      .mockReturnValue({
        detail: null,
        isLoading: false,
        error: null,
        notFound: true
      });

    renderPage();

    expect(
      screen.getByRole("heading", {
        name: "Character not found"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Back to characters"
      })
    ).toHaveAttribute(
      "href",
      "/characters"
    );
  });

  it("shows the character's assigned tags compactly", () => {
    renderPage();

    expect(
      screen.getByText("Raid")
    ).toBeInTheDocument();
  });

  it("shows a compact Data section distinguishing never-captured, partial, and not-tracked - never a fake fresh state", () => {
    renderPage();

    expect(
      screen.getByRole("heading", {
        name: "Data"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Never captured"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Partial")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(
        "Not tracked"
      ).length
    ).toBeGreaterThan(0);
  });
});
