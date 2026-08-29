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

  it("shows the empty state when no profession weekly sources are tracked yet", () => {
    renderPage();

    expect(
      screen.getByText(
        "No profession weekly sources tracked yet."
      )
    ).toBeInTheDocument();
  });

  it("renders per-profession Weekly Quest/Treatise/Drops status once captured", () => {
    const detail = buildDetail();

    mocks.useCharacterControlDetail.mockReturnValue({
      detail: {
        ...detail,
        character: {
          ...detail.character,
          professionWeekly: {
            state: "ATTENTION",
            quest: {
              completeCount: 1,
              incompleteCount: 0,
              unknownCount: 0,
              applicableTotal: 1
            },
            treatise: {
              completeCount: 0,
              incompleteCount: 1,
              unknownCount: 0,
              applicableTotal: 1
            },
            drops: {
              completeCount: 0,
              incompleteCount: 1,
              unknownCount: 0,
              applicableTotal: 1
            },
            professions: [
              {
                professionKey: "alchemy",
                name: "Alchemy",
                quest: {
                  sourceKey: "weekly-quest",
                  name: "Weekly Quest",
                  sourceType: "WEEKLY_QUEST",
                  state: "COMPLETE",
                  currentValue: null,
                  maxValue: null,
                  capturedAt: null
                },
                treatise: {
                  sourceKey: "treatise",
                  name: "Treatise",
                  sourceType: "TREATISE",
                  state: "INCOMPLETE",
                  currentValue: null,
                  maxValue: null,
                  capturedAt: null
                },
                drops: {
                  sourceKey: "knowledge-drops",
                  name: "Knowledge Drops",
                  sourceType: "KNOWLEDGE_DROPS",
                  state: "INCOMPLETE",
                  currentValue: 1,
                  maxValue: 2,
                  capturedAt: null
                }
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
      screen.getByRole("heading", { name: "Alchemy" })
    ).toBeInTheDocument();

    expect(
      screen.getByTitle("Complete this week")
    ).toHaveTextContent("✓");

    expect(
      screen.getAllByTitle(
        "Not complete this week"
      ).length
    ).toBeGreaterThan(0);

    expect(screen.getByText("1/2")).toBeInTheDocument();
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
      screen.getByRole("heading", {
        name: "Permanent Knowledge"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Knowledge Treasures")
    ).toBeInTheDocument();

    expect(screen.getByText("8/8")).toBeInTheDocument();

    expect(
      screen.getByTitle("All knowledge treasures collected")
    ).toHaveTextContent("✓");
  });
});
