import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listJournalInstances: vi.fn(),
  listJournalEncounters: vi.fn(),
  listJournalLoot: vi.fn()
}));

vi.mock("../api/bonusRollApi", () => api);

import { BonusRollPlanForm } from "./BonusRollPlanForm";

const characters = [
  {
    id: "char-1",
    name: "Syntax",
    realm: "Blackrock",
    region: "eu",
    className: "Mage",
    level: 90,
    source: "MANUAL",
    lastSyncedAt: null,
    createdAt: "",
    updatedAt: "",
    professions: []
  }
];

describe("BonusRollPlanForm", () => {
  beforeEach(() => {
    api.listJournalInstances.mockResolvedValue({
      items: [
        { id: 1320, name: "Der Giftige Abgrund", kind: "RAID" },
        { id: 1322, name: "Altar der Fänge", kind: "DUNGEON" }
      ]
    });
    api.listJournalEncounters.mockResolvedValue({ items: [{ id: 2895, name: "Ula'tek" }] });
    api.listJournalLoot.mockResolvedValue({
      items: [{ id: 900002, name: "Giftschuppenhelm", slot: "Kopf", quality: "EPIC" }]
    });
  });

  it("chains character, season instance, boss and target item from the Journal and submits ids", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<BonusRollPlanForm characters={characters} onSubmit={onSubmit} />);

    const submit = screen.getByRole("button", { name: "Add roll" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Character"), { target: { value: "char-1" } });
    await screen.findByRole("option", { name: "Der Giftige Abgrund" });
    fireEvent.change(screen.getByLabelText("Instance"), { target: { value: "1320" } });

    await screen.findByRole("option", { name: "Ula'tek" });
    expect(api.listJournalEncounters).toHaveBeenCalledWith(1320);
    fireEvent.change(screen.getByLabelText("Boss"), { target: { value: "2895" } });

    await screen.findByRole("option", { name: "Giftschuppenhelm · Kopf" });
    expect(api.listJournalLoot).toHaveBeenCalledWith(1320, 2895);
    fireEvent.change(screen.getByLabelText("Target item"), { target: { value: "900002" } });
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "  BiS  " } });

    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        characterId: "char-1",
        instanceId: 1320,
        encounterId: 2895,
        targetItemId: 900002,
        note: "BiS"
      })
    );
  });

  it("groups instances into raids and dungeons", async () => {
    render(<BonusRollPlanForm characters={characters} onSubmit={vi.fn()} />);

    await screen.findByRole("option", { name: "Der Giftige Abgrund" });
    expect(screen.getByRole("group", { name: "Raids" })).toHaveTextContent("Der Giftige Abgrund");
    expect(screen.getByRole("group", { name: "Dungeons" })).toHaveTextContent("Altar der Fänge");
  });

  it("shows a Journal loading failure instead of an empty dropdown", async () => {
    api.listJournalInstances.mockRejectedValue(new Error("Die Instanzen der aktuellen Season konnten nicht von Blizzard geladen werden."));
    render(<BonusRollPlanForm characters={characters} onSubmit={vi.fn()} />);

    expect(await screen.findByText(/konnten nicht von Blizzard geladen werden/)).toBeInTheDocument();
  });
});
