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
  useCharacterControlDetail: vi.fn()
}));

vi.mock("../hooks/useCharacterControlDetail", () => ({
  useCharacterControlDetail: mocks.useCharacterControlDetail
}));

const { CharacterDetailPage } = await import("./CharacterDetailPage");

function renderPage() {
  return renderCharacterDetailRoute(<CharacterDetailPage />);
}

describe("CharacterDetailPage - Knowledge Treasures", () => {
  beforeEach(() => {
    mocks.useCharacterControlDetail.mockReturnValue({
      detail: buildDetail(),
      isLoading: false,
      error: null,
      notFound: false
    });
  });

  it("shows Permanent Knowledge Treasures separately from weekly sources", () => {
    const detail = buildDetail();

    mocks.useCharacterControlDetail.mockReturnValue({
      detail: {
        ...detail,
        character: {
          ...detail.character,
          professionKnowledgeTreasures: {
            state: "READY",
            treasures: {
              completeCount: 8,
              incompleteCount: 0,
              unknownCount: 0,
              applicableTotal: 8
            },
            professions: [
              {
                professionKey: "alchemy",
                name: "Alchemy",
                treasures: {
                  completeCount: 8,
                  incompleteCount: 0,
                  unknownCount: 0,
                  applicableTotal: 8
                },
                sources: []
              }
            ]
          }
        }
      },
      isLoading: false,
      error: null,
      notFound: false
    });

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Permanent Knowledge" })
    ).toBeInTheDocument();
    expect(screen.getByText("Knowledge Treasures")).toBeInTheDocument();
    expect(screen.getByText("8/8")).toBeInTheDocument();
    expect(
      screen.getByTitle("All knowledge treasures collected")
    ).toHaveTextContent("✓");
  });

  it("shows Permanent Knowledge as ? when treasure evidence is still unresolved", () => {
    const detail = buildDetail();

    mocks.useCharacterControlDetail.mockReturnValue({
      detail: {
        ...detail,
        character: {
          ...detail.character,
          professionKnowledgeTreasures: {
            state: "UNKNOWN",
            treasures: {
              completeCount: 0,
              incompleteCount: 0,
              unknownCount: 8,
              applicableTotal: 8
            },
            professions: [
              {
                professionKey: "alchemy",
                name: "Alchemy",
                treasures: {
                  completeCount: 0,
                  incompleteCount: 0,
                  unknownCount: 8,
                  applicableTotal: 8
                },
                sources: []
              }
            ]
          }
        }
      },
      isLoading: false,
      error: null,
      notFound: false
    });

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Permanent Knowledge" })
    ).toBeInTheDocument();
    expect(screen.getByText("Knowledge Treasures")).toBeInTheDocument();
    expect(
      document.querySelector(".character-profession-treasure-value")
    ).toHaveTextContent("?");
    expect(
      screen.getByTitle("Knowledge treasure evidence incomplete")
    ).toHaveTextContent("?");
  });
});
