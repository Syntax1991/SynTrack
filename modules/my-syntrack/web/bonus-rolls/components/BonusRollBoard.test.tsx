import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BonusRoll } from "../types/bonusRoll.types";

const api = vi.hoisted(() => ({ listJournalLoot: vi.fn() }));

vi.mock("../api/bonusRollApi", () => api);

import { BonusRollBoard } from "./BonusRollBoard";

const helm = { id: 900002, name: "Venomscale Helm", iconUrl: "https://render.example/helm.jpg" };

const base: BonusRoll = {
  id: "roll-1",
  character: { id: "char-1", name: "Syntax", realm: "Blackrock", className: "Mage" },
  instance: { id: 1320, name: "The Venomous Abyss" },
  encounter: { id: 2895, name: "Ula'tek" },
  targetItem: helm,
  status: "PLANNED",
  outcome: null,
  receivedItem: null,
  gotTarget: false,
  note: "BiS",
  rolledAt: null,
  createdAt: "2026-10-22T10:00:00.000Z"
};

type BoardHandlers = Partial<Omit<ComponentProps<typeof BonusRollBoard>, "rolls">>;

const resolved = () => Promise.resolve();

function renderBoard(rolls: BonusRoll[], handlers: BoardHandlers = {}) {
  render(
    <BonusRollBoard
      onClearResult={handlers.onClearResult ?? resolved}
      onDelete={handlers.onDelete ?? resolved}
      onRecordResult={handlers.onRecordResult ?? resolved}
      rolls={rolls}
    />
  );
}

describe("BonusRollBoard", () => {
  it("groups rolls by character and shows target, boss, instance and note", () => {
    renderBoard([
      base,
      { ...base, id: "roll-2", character: { ...base.character, id: "char-2", name: "Alt" }, note: null }
    ]);

    const groups = screen.getAllByRole("article");
    expect(groups.map((group) => within(group).getAllByText(/^(Alt|Syntax)$/)[0]?.textContent)).toEqual(["Alt", "Syntax"]);

    const row = screen.getByRole("listitem", { name: "Syntax – Ula'tek" });
    expect(within(row).getByText("Venomscale Helm")).toBeInTheDocument();
    expect(within(row).getByText(/The Venomous Abyss/)).toBeInTheDocument();
    expect(within(row).getByText("BiS")).toBeInTheDocument();
    expect(within(row).getByText("Planned")).toBeInTheDocument();
  });

  it("distinguishes target received, another item, and gold only", () => {
    renderBoard([
      { ...base, id: "a", status: "ROLLED", outcome: "ITEM", receivedItem: helm, gotTarget: true, rolledAt: "2026-10-21T19:00:00.000Z" },
      { ...base, id: "b", status: "ROLLED", outcome: "ITEM", receivedItem: { id: 900001, name: "Fang of the Abyss", iconUrl: null } },
      { ...base, id: "c", status: "ROLLED", outcome: "NO_ITEM" }
    ]);

    expect(screen.getByText("Target received")).toBeInTheDocument();
    expect(screen.getByText("Other item")).toBeInTheDocument();
    expect(screen.getByText("Got Fang of the Abyss")).toBeInTheDocument();
    expect(screen.getByText("Gold only")).toBeInTheDocument();
  });

  it("filters planned and rolled rolls", () => {
    renderBoard([base, { ...base, id: "r", status: "ROLLED", outcome: "NO_ITEM" }]);

    const badges = () => screen.getAllByRole("listitem").map((row) => row.querySelector(".bonus-roll-badge")?.textContent);

    expect(badges()).toEqual(["Planned", "Gold only"]);

    fireEvent.click(screen.getByRole("radio", { name: /Rolled/ }));
    expect(badges()).toEqual(["Gold only"]);

    fireEvent.click(screen.getByRole("radio", { name: /Planned/ }));
    expect(badges()).toEqual(["Planned"]);
  });

  it("enters what the character received, pre-selecting the target from the boss loot", async () => {
    api.listJournalLoot.mockResolvedValue({
      items: [
        { id: 900001, name: "Fang of the Abyss", slot: "One-Hand", quality: "EPIC", iconUrl: null },
        { id: 900002, name: "Venomscale Helm", slot: "Head", quality: "EPIC", iconUrl: null }
      ]
    });
    const onRecordResult = vi.fn().mockResolvedValue(undefined);
    renderBoard([base], { onRecordResult });

    fireEvent.click(screen.getByRole("button", { name: "Enter result" }));
    await screen.findByRole("option", { name: "Fang of the Abyss · One-Hand" });
    expect(api.listJournalLoot).toHaveBeenCalledWith(1320, 2895);
    expect(screen.getByLabelText("Received item")).toHaveValue("900002");

    fireEvent.change(screen.getByLabelText("Received item"), { target: { value: "900001" } });
    fireEvent.click(screen.getByRole("button", { name: "Save result" }));

    await waitFor(() => expect(onRecordResult).toHaveBeenCalledWith("roll-1", { outcome: "ITEM", receivedItemId: 900001 }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save result" })).not.toBeInTheDocument());
  });

  it("records a gold-only result without an item", async () => {
    api.listJournalLoot.mockResolvedValue({ items: [] });
    const onRecordResult = vi.fn().mockResolvedValue(undefined);
    renderBoard([base], { onRecordResult });

    fireEvent.click(screen.getByRole("button", { name: "Enter result" }));
    fireEvent.click(screen.getByRole("radio", { name: "Gold only" }));
    expect(screen.queryByLabelText("Received item")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save result" }));

    await waitFor(() => expect(onRecordResult).toHaveBeenCalledWith("roll-1", { outcome: "NO_ITEM", receivedItemId: null }));
  });

  it("resets a rolled entry to planned and deletes only after confirmation", () => {
    const onClearResult = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderBoard([{ ...base, status: "ROLLED", outcome: "NO_ITEM" }], { onClearResult, onDelete });

    fireEvent.click(screen.getByRole("button", { name: "Back to planned" }));
    expect(onClearResult).toHaveBeenCalledWith("roll-1");

    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("roll-1");
    confirm.mockRestore();
  });

  it("shows an empty state", () => {
    renderBoard([]);

    expect(screen.getByText("No bonus rolls yet")).toBeInTheDocument();
  });
});
