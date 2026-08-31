import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovedCharactersPanel } from "./RemovedCharactersPanel";

describe("RemovedCharactersPanel", () => {
  it("shows empty state when there are no removed characters", () => {
    render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    expect(screen.getByText("No removed characters.")).toBeInTheDocument();
  });

  it("lists character, realm, and restore action", () => {
    render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[
          {
            id: "removed-1",
            characterName: "Synblast",
            realmName: "Antonidas",
            removedAt: "2026-08-31T12:00:00.000Z"
          }
        ]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    expect(screen.getByText("Synblast")).toBeInTheDocument();
    expect(screen.getByText("Antonidas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restore" })
    ).toBeInTheDocument();
  });

  it("calls onRestore with the removed id when Restore is clicked", () => {
    const onRestore = vi.fn();

    render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[
          {
            id: "removed-1",
            characterName: "Synblast",
            realmName: "Antonidas",
            removedAt: "2026-08-31T12:00:00.000Z"
          }
        ]}
        onRestore={onRestore}
        restoringId={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(onRestore).toHaveBeenCalledWith("removed-1");
  });
});
