import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovedCharactersPanel } from "./RemovedCharactersPanel";

const synblastItem = {
  id: "removed-1",
  characterName: "Synblast",
  realmName: "Antonidas",
  removedAt: "2026-08-31T12:00:00.000Z"
};

const synbanksItem = {
  id: "removed-2",
  characterName: "Synbanks",
  realmName: "Antonidas",
  removedAt: "2026-09-01T12:00:00.000Z"
};

const testcharItem = {
  id: "removed-3",
  characterName: "Testchar",
  realmName: "Blackhand",
  removedAt: "2026-08-30T12:00:00.000Z"
};

function getDisclosure(container: HTMLElement) {
  const disclosure = container.querySelector("details");

  if (!disclosure) {
    throw new Error("Expected removed-characters disclosure");
  }

  return disclosure;
}

describe("RemovedCharactersPanel", () => {
  it("renders nothing when there are no removed characters", () => {
    const { container } = render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/Removed from SynTrack/)).not.toBeInTheDocument();
    expect(screen.queryByText("No removed characters.")).not.toBeInTheDocument();
  });

  it("renders nothing while loading", () => {
    const { container } = render(
      <RemovedCharactersPanel
        isLoading
        items={[synblastItem]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows collapsed disclosure summary for one removed character", () => {
    const { container } = render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[synblastItem]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    expect(
      screen.getByText("Removed from SynTrack (1)")
    ).toBeInTheDocument();
    expect(getDisclosure(container)).not.toHaveAttribute("open");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("REMOVED CHARACTERS")).not.toBeInTheDocument();
  });

  it("shows character details and restore action when expanded", () => {
    const { container } = render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[synbanksItem]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    fireEvent.click(screen.getByText("Removed from SynTrack (1)"));
    expect(getDisclosure(container)).toHaveAttribute("open");

    expect(
      screen.getByText("Sync suppressed until restored")
    ).toBeVisible();
    expect(screen.getByText("Synbanks · Antonidas")).toBeVisible();
    expect(screen.getByText("Removed 1 Sept 2026")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Restore" })
    ).toBeVisible();
  });

  it("shows the correct count for multiple removed characters", () => {
    render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[synbanksItem, testcharItem]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    fireEvent.click(screen.getByText("Removed from SynTrack (2)"));

    expect(screen.getByText("Synbanks · Antonidas")).toBeVisible();
    expect(screen.getByText("Testchar · Blackhand")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Restore" })).toHaveLength(2);
  });

  it("calls onRestore with the removed id when Restore is clicked", () => {
    const onRestore = vi.fn();

    render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[synblastItem]}
        onRestore={onRestore}
        restoringId={null}
      />
    );

    fireEvent.click(screen.getByText("Removed from SynTrack (1)"));
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    expect(onRestore).toHaveBeenCalledWith("removed-1");
  });

  it("disappears after restoring the final removed character", () => {
    const { rerender, container } = render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[synblastItem]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    expect(
      screen.getByText("Removed from SynTrack (1)")
    ).toBeInTheDocument();

    rerender(
      <RemovedCharactersPanel
        isLoading={false}
        items={[]}
        onRestore={vi.fn()}
        restoringId={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows restoring state on the active restore button", () => {
    render(
      <RemovedCharactersPanel
        isLoading={false}
        items={[synblastItem, synbanksItem]}
        onRestore={vi.fn()}
        restoringId="removed-2"
      />
    );

    fireEvent.click(screen.getByText("Removed from SynTrack (2)"));

    const rows = screen.getAllByRole("listitem");
    expect(
      within(rows[1]!).getByRole("button", { name: "Restoring…" })
    ).toBeDisabled();
    expect(
      within(rows[0]!).getByRole("button", { name: "Restore" })
    ).not.toBeDisabled();
  });
});
