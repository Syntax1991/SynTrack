import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterRemoveDialog } from "./CharacterRemoveDialog";

describe("CharacterRemoveDialog", () => {
  it("shows confirmation copy for the character and realm", () => {
    render(
      <CharacterRemoveDialog
        characterName="Synblast"
        isRemoving={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        realmName="Antonidas"
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "Remove Synblast - Antonidas from SynTrack?"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /prevents automatic WoW sync from adding it again/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("You can restore the character later.")
    ).toBeInTheDocument();
  });

  it("exposes Cancel and Remove character actions", () => {
    render(
      <CharacterRemoveDialog
        characterName="Synblast"
        isRemoving={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        realmName="Antonidas"
      />
    );

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove character" })
    ).toBeInTheDocument();
  });

  it("does not call onConfirm until Remove character is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <CharacterRemoveDialog
        characterName="Synblast"
        isRemoving={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
        realmName="Antonidas"
      />
    );

    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove character" })
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
