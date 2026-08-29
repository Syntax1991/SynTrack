import {
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type {
  WeeklyChecklistCharacter,
  WeeklyChecklistTask
} from "../types/weeklyChecklist.types";
import { WeeklyChecklistMatrix } from "./WeeklyChecklistMatrix";

const tasks: WeeklyChecklistTask[] = [
  {
    key: "great-vault",
    title: "Great Vault progress",
    description: "Log Vault-eligible activity.",
    category: "WEEKLY PROGRESS",
    sortOrder: 10
  },
  {
    key: "mythic-plus",
    title: "Mythic+ key",
    description: "Push a weekly key.",
    category: "WEEKLY PROGRESS",
    sortOrder: 20
  },
  {
    key: "raid-readiness",
    title: "Raid readiness",
    description: "Confirm raid prep.",
    category: "RAID",
    sortOrder: 30
  },
  {
    key: "profession-knowledge",
    title: "Profession knowledge",
    description: "Spend knowledge points.",
    category: "PROFESSIONS",
    sortOrder: 40
  },
  {
    key: "gear-readiness",
    title: "Gear readiness",
    description: "Check enchants/gems.",
    category: "GEAR",
    sortOrder: 50
  }
];

const zeroAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

function buildCharacter(
  overrides: Partial<WeeklyChecklistCharacter> = {}
): WeeklyChecklistCharacter {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80,
    completedTaskKeys: [],
    professionWeekly: {
      state: "NOT_TRACKED",
      profKp: zeroAggregate,
      drops: zeroAggregate,
      professions: []
    },
    ...overrides
  };
}

function renderWithRouter(
  node: ReactNode
) {
  return render(
    <MemoryRouter>{node}</MemoryRouter>
  );
}

describe("WeeklyChecklistMatrix", () => {
  it("renders exactly one row per character", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            name: "Synblast"
          }),
          buildCharacter({
            id: "char-2",
            name: "Synbloom"
          })
        ]}
        onToggleAll={vi.fn()}
        onToggleTask={vi.fn()}
        pendingAction={null}
        tasks={tasks}
      />
    );

    expect(
      screen.getAllByRole("row")
    ).toHaveLength(3);
  });

  it("links the character name without turning task cells into navigation", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            id: "char-7"
          })
        ]}
        onToggleAll={vi.fn()}
        onToggleTask={vi.fn()}
        pendingAction={null}
        tasks={tasks}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "Synblast"
      })
    ).toHaveAttribute(
      "href",
      "/characters/char-7"
    );

    expect(
      screen.getAllByRole("button")
        .length
    ).toBeGreaterThan(0);
  });

  it("keeps each character's task states in their own row only, never bleeding into another character's row", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            name: "Synblast",
            completedTaskKeys: [
              "great-vault",
              "mythic-plus"
            ]
          }),
          buildCharacter({
            id: "char-2",
            name: "Synbloom",
            completedTaskKeys: []
          })
        ]}
        onToggleAll={vi.fn()}
        onToggleTask={vi.fn()}
        pendingAction={null}
        tasks={tasks}
      />
    );

    const rows = screen.getAllByRole("row");
    const synblastRow = within(rows[1]!);
    const synbloomRow = within(rows[2]!);

    expect(
      synblastRow.getByText("2/5")
    ).toBeInTheDocument();

    expect(
      synbloomRow.getByText("0/5")
    ).toBeInTheDocument();

    expect(
      synblastRow.getAllByTitle(
        /- complete$/
      )
    ).toHaveLength(2);

    expect(
      synbloomRow.queryAllByTitle(
        /- complete$/
      )
    ).toHaveLength(0);
  });

  it("distinguishes explicit complete from incomplete with different tokens", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            completedTaskKeys: [
              "great-vault"
            ]
          })
        ]}
        onToggleAll={vi.fn()}
        onToggleTask={vi.fn()}
        pendingAction={null}
        tasks={tasks}
      />
    );

    expect(
      screen.getByTitle(
        "Great Vault progress - complete"
      )
    ).toHaveTextContent("✓");

    expect(
      screen.getByTitle(
        "Mythic+ key - incomplete"
      )
    ).toHaveTextContent("○");
  });

  it("toggles a single task for the correct character when its cell is clicked", () => {
    const onToggleTask = vi.fn();

    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            name: "Synblast"
          }),
          buildCharacter({
            id: "char-2",
            name: "Synbloom"
          })
        ]}
        onToggleAll={vi.fn()}
        onToggleTask={onToggleTask}
        pendingAction={null}
        tasks={tasks}
      />
    );

    const rows = screen.getAllByRole("row");
    const synbloomRow = within(rows[2]!);

    fireEvent.click(
      synbloomRow.getByTitle(
        "Mythic+ key - incomplete"
      )
    );

    expect(onToggleTask).toHaveBeenCalledWith(
      "char-2",
      "mythic-plus",
      true
    );
  });

  it("still supports Complete all per row", () => {
    const onToggleAll = vi.fn();

    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({ id: "char-1" })
        ]}
        onToggleAll={onToggleAll}
        onToggleTask={vi.fn()}
        pendingAction={null}
        tasks={tasks}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Complete all"
      })
    );

    expect(onToggleAll).toHaveBeenCalledWith(
      "char-1",
      true
    );
  });

  it("shows the automatic Prof KP and Drops columns additively, alongside the manual profession-knowledge task", () => {
    renderWithRouter(
      <WeeklyChecklistMatrix
        characters={[
          buildCharacter({
            id: "char-1",
            completedTaskKeys: [
              "profession-knowledge"
            ],
            professionWeekly: {
              state: "ATTENTION",
              profKp: {
                completeCount: 3,
                incompleteCount: 1,
                unknownCount: 0,
                applicableTotal: 4
              },
              drops: zeroAggregate,
              professions: []
            }
          })
        ]}
        onToggleAll={vi.fn()}
        onToggleTask={vi.fn()}
        pendingAction={null}
        tasks={tasks}
      />
    );

    expect(
      screen.getByText("3/4")
    ).toBeInTheDocument();

    expect(
      screen.getByText("–")
    ).toBeInTheDocument();
  });
});
