import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BonusRoll } from "../types/bonusRoll.types";

const api = vi.hoisted(() => ({ listJournalLoot: vi.fn() }));

vi.mock("../api/bonusRollApi", () => api);

import { BonusRollTable } from "./BonusRollTable";

const base: BonusRoll = {
  id: "roll-1",
  character: { id: "char-1", name: "Syntax", realm: "Blackrock", className: "Mage" },
  instance: { id: 1320, name: "Der Giftige Abgrund" },
  encounter: { id: 2895, name: "Ula'tek" },
  targetItem: { id: 900002, name: "Giftschuppenhelm" },
  status: "PLANNED",
  outcome: null,
  receivedItem: null,
  gotTarget: false,
  note: "BiS",
  rolledAt: null,
  createdAt: "2026-10-22T10:00:00.000Z"
};

type TableHandlers = Partial<Omit<ComponentProps<typeof BonusRollTable>, "rolls">>;

const resolved = () => Promise.resolve();

function renderTable(rolls: BonusRoll[], handlers: TableHandlers = {}) {
  render(
    <BonusRollTable
      onClearResult={handlers.onClearResult ?? resolved}
      onDelete={handlers.onDelete ?? resolved}
      onRecordResult={handlers.onRecordResult ?? resolved}
      rolls={rolls}
    />
  );
}

describe("BonusRollTable", () => {
  it("shows planned rolls with boss, instance, target and note", () => {
    renderTable([base]);

    const row = screen.getByRole("row", { name: /Syntax/ });
    expect(within(row).getByText("Ula'tek")).toBeInTheDocument();
    expect(within(row).getByText("Der Giftige Abgrund")).toBeInTheDocument();
    expect(within(row).getByText("Giftschuppenhelm")).toBeInTheDocument();
    expect(within(row).getByText("BiS")).toBeInTheDocument();
    expect(within(row).getByText("Planned")).toBeInTheDocument();
  });

  it("distinguishes target received, another item, and gold only", () => {
    renderTable([
      { ...base, id: "a", status: "ROLLED", outcome: "ITEM", receivedItem: base.targetItem, gotTarget: true, rolledAt: "2026-10-21T19:00:00.000Z" },
      { ...base, id: "b", status: "ROLLED", outcome: "ITEM", receivedItem: { id: 900001, name: "Fangzahn des Abgrunds" } },
      { ...base, id: "c", status: "ROLLED", outcome: "NO_ITEM" }
    ]);

    expect(screen.getByText("Target received: Giftschuppenhelm")).toBeInTheDocument();
    expect(screen.getByText("Received: Fangzahn des Abgrunds")).toBeInTheDocument();
    expect(screen.getByText("No item (gold)")).toBeInTheDocument();
  });

  it("enters what the character received, pre-selecting the target from the boss loot", async () => {
    api.listJournalLoot.mockResolvedValue({
      items: [
        { id: 900001, name: "Fangzahn des Abgrunds", slot: "Einhändig", quality: "EPIC" },
        { id: 900002, name: "Giftschuppenhelm", slot: "Kopf", quality: "EPIC" }
      ]
    });
    const onRecordResult = vi.fn().mockResolvedValue(undefined);
    renderTable([base], { onRecordResult });

    fireEvent.click(screen.getByRole("button", { name: "Enter result" }));
    await screen.findByRole("option", { name: "Fangzahn des Abgrunds · Einhändig" });
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
    renderTable([base], { onRecordResult });

    fireEvent.click(screen.getByRole("button", { name: "Enter result" }));
    fireEvent.change(screen.getByLabelText("Result"), { target: { value: "NO_ITEM" } });
    expect(screen.queryByLabelText("Received item")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save result" }));

    await waitFor(() => expect(onRecordResult).toHaveBeenCalledWith("roll-1", { outcome: "NO_ITEM", receivedItemId: null }));
  });

  it("resets a rolled entry to planned and deletes only after confirmation", () => {
    const onClearResult = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderTable([{ ...base, status: "ROLLED", outcome: "NO_ITEM" }], { onClearResult, onDelete });

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
    renderTable([]);

    expect(screen.getByText(/No bonus rolls planned yet/)).toBeInTheDocument();
  });
});
