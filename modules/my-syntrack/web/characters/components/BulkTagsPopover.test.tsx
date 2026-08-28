import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TagView } from "../../tags/types/tag.types";
import { BulkTagsPopover } from "./BulkTagsPopover";

function tag(
  overrides: Partial<TagView> = {}
): TagView {
  return {
    id: "tag-raid",
    name: "Raid",
    color: null,
    sortOrder: 0,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides
  };
}

describe("BulkTagsPopover", () => {
  it("shows a plain unchecked checkbox for a tag nobody in the selection has (NONE)", () => {
    render(
      <BulkTagsPopover
        onAddToAll={vi.fn()}
        onClose={vi.fn()}
        onRemoveFromAll={vi.fn()}
        selectedCharacterIds={
          new Set(["char-1", "char-2"])
        }
        selectedCount={2}
        tagIdsByCharacterId={new Map()}
        tags={[tag()]}
      />
    );

    const checkbox = screen.getByRole(
      "checkbox",
      { name: "Raid" }
    );

    expect(checkbox).not.toBeChecked();
    expect(
      (checkbox as HTMLInputElement)
        .indeterminate
    ).toBe(false);

    expect(
      screen.queryByText("Add to all")
    ).not.toBeInTheDocument();
  });

  it("shows a checked checkbox for a tag every selected character has (ALL)", () => {
    render(
      <BulkTagsPopover
        onAddToAll={vi.fn()}
        onClose={vi.fn()}
        onRemoveFromAll={vi.fn()}
        selectedCharacterIds={
          new Set(["char-1", "char-2"])
        }
        selectedCount={2}
        tagIdsByCharacterId={
          new Map([
            [
              "char-1",
              new Set(["tag-raid"])
            ],
            [
              "char-2",
              new Set(["tag-raid"])
            ]
          ])
        }
        tags={[tag()]}
      />
    );

    expect(
      screen.getByRole("checkbox", {
        name: "Raid"
      })
    ).toBeChecked();
  });

  it("shows an indeterminate, disabled checkbox plus explicit actions for a mixed tag (SOME)", () => {
    render(
      <BulkTagsPopover
        onAddToAll={vi.fn()}
        onClose={vi.fn()}
        onRemoveFromAll={vi.fn()}
        selectedCharacterIds={
          new Set(["char-1", "char-2"])
        }
        selectedCount={2}
        tagIdsByCharacterId={
          new Map([
            [
              "char-1",
              new Set(["tag-raid"])
            ]
          ])
        }
        tags={[tag()]}
      />
    );

    const checkbox = screen.getByRole(
      "checkbox",
      { name: "Raid" }
    );

    expect(checkbox).not.toBeChecked();
    expect(
      (checkbox as HTMLInputElement)
        .indeterminate
    ).toBe(true);
    expect(checkbox).toBeDisabled();

    expect(
      screen.getByText("Add to all")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Remove from all"
      )
    ).toBeInTheDocument();
  });

  it("clicking a NONE tag's checkbox adds it to all selected characters", () => {
    const onAddToAll = vi.fn();

    render(
      <BulkTagsPopover
        onAddToAll={onAddToAll}
        onClose={vi.fn()}
        onRemoveFromAll={vi.fn()}
        selectedCharacterIds={
          new Set(["char-1"])
        }
        selectedCount={1}
        tagIdsByCharacterId={new Map()}
        tags={[tag()]}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Raid"
      })
    );

    expect(onAddToAll).toHaveBeenCalledWith(
      "tag-raid"
    );
  });

  it("clicking an ALL tag's checkbox removes it from all selected characters", () => {
    const onRemoveFromAll = vi.fn();

    render(
      <BulkTagsPopover
        onAddToAll={vi.fn()}
        onClose={vi.fn()}
        onRemoveFromAll={onRemoveFromAll}
        selectedCharacterIds={
          new Set(["char-1"])
        }
        selectedCount={1}
        tagIdsByCharacterId={
          new Map([
            [
              "char-1",
              new Set(["tag-raid"])
            ]
          ])
        }
        tags={[tag()]}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Raid"
      })
    );

    expect(
      onRemoveFromAll
    ).toHaveBeenCalledWith("tag-raid");
  });

  it("SOME state's explicit buttons call the correct handler with no guessing", () => {
    const onAddToAll = vi.fn();
    const onRemoveFromAll = vi.fn();

    render(
      <BulkTagsPopover
        onAddToAll={onAddToAll}
        onClose={vi.fn()}
        onRemoveFromAll={onRemoveFromAll}
        selectedCharacterIds={
          new Set(["char-1", "char-2"])
        }
        selectedCount={2}
        tagIdsByCharacterId={
          new Map([
            [
              "char-1",
              new Set(["tag-raid"])
            ]
          ])
        }
        tags={[tag()]}
      />
    );

    fireEvent.click(
      screen.getByText("Add to all")
    );

    expect(onAddToAll).toHaveBeenCalledWith(
      "tag-raid"
    );

    fireEvent.click(
      screen.getByText(
        "Remove from all"
      )
    );

    expect(
      onRemoveFromAll
    ).toHaveBeenCalledWith("tag-raid");
  });
});
