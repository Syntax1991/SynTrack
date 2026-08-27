import {
  render,
  screen
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes
} from "react-router-dom";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import type { CharacterControlDetailResponse } from "../types/characterControlDetail.types";

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

function buildDetail(): CharacterControlDetailResponse {
  return {
    period: {
      key: "2026-08-26",
      startsAt:
        "2026-08-26T07:00:00.000Z",
      endsAt:
        "2099-09-02T07:00:00.000Z"
    },
    character: {
      character: {
        id: "char-2",
        name: "Synbloom",
        realm: "Antonidas",
        region: "eu",
        className: "Druid",
        level: 80
      },
      weekly: {
        state: "IN_PROGRESS",
        completed: 3,
        total: 5,
        source: "MANUAL_CHECKLIST"
      },
      vault: {
        state: "UNKNOWN",
        unlockedSlots: 0,
        slotsTotal: 3,
        highestKeyLevel: null,
        source: "MANUAL_LOG"
      },
      professions: {
        state: "READY",
        issueCount: 0,
        issues: [],
        items: [
          {
            professionId:
              "profession-alchemy",
            key: "alchemy",
            name: "Alchemy",
            category: "CRAFTING",
            skill: 100,
            knowledgePoints: 42,
            dataStatus: "TRACKED"
          }
        ]
      },
      gear: {
        state: "NOT_TRACKED",
        readinessPercent: null,
        trackedSlots: 0,
        totalRelevantSlots: 16,
        missingEnchantCount: 0,
        emptySocketCount: 0,
        itemLevel: null
      },
      tier: {
        state: "NOT_TRACKED"
      },
      embellishments: {
        state: "NOT_TRACKED"
      },
      trackers: [
        {
          trackerDefinitionId:
            "tracker-false",
          characterId: "char-2",
          periodKey:
            "2026-08-26",
          state: "RECORDED",
          source: "MANUAL",
          value: {
            valueType: "BOOLEAN",
            boolean: false
          }
        }
      ],
      attentionItems: [
        {
          id: "char-2:weekly",
          characterId: "char-2",
          characterName: "Synbloom",
          domain: "weekly",
          severity: "this-week",
          label:
            "Weekly tasks remaining",
          detail:
            "2 of 5 weekly tasks left",
          path: "/weekly-checklist"
        }
      ],
      readinessState: "attention",
      nextAction: {
        domain: "weekly",
        label:
          "Weekly tasks remaining",
        detail:
          "2 of 5 weekly tasks left",
        path: "/weekly-checklist",
        severity: "this-week"
      }
    },
    trackerColumns: [
      {
        id: "tracker-false",
        scopeKey: "midnight",
        key: "cracked",
        name: "Cracked",
        valueType: "BOOLEAN",
        resetBehavior: "SEASONAL",
        category: null,
        sortOrder: 10,
        isPinned: true,
        enabled: true
      },
      {
        id: "tracker-unknown",
        scopeKey: "midnight",
        key: "world-tour",
        name: "World Tour",
        valueType: "BOOLEAN",
        resetBehavior: "SEASONAL",
        category: null,
        sortOrder: 20,
        isPinned: true,
        enabled: true
      }
    ]
  };
}

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/characters/char-2"
      ]}
    >
      <Routes>
        <Route
          element={
            <CharacterDetailPage />
          }
          path="/characters/:characterId"
        />
      </Routes>
    </MemoryRouter>
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
});
