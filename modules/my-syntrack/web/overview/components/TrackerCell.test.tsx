import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrackerDefinitionView } from "../types/overview.types";
import { TrackerCell } from "./TrackerCell";

const {
  setTrackerValue,
  clearTrackerValue
} = vi.hoisted(() => ({
  setTrackerValue: vi.fn().mockResolvedValue({}),
  clearTrackerValue: vi.fn().mockResolvedValue({})
}));

vi.mock("../../trackers/api/trackerApi", () => ({
  setTrackerValue,
  clearTrackerValue
}));

const booleanDefinition: TrackerDefinitionView = {
  id: "tracker-1",
  scopeKey: "MIDNIGHT-S1",
  key: "world-tour",
  name: "World Tour",
  valueType: "BOOLEAN",
  resetBehavior: "SEASONAL",
  category: null,
  sortOrder: 0,
  isPinned: true,
  enabled: true
};

const progressDefinition: TrackerDefinitionView = {
  ...booleanDefinition,
  id: "tracker-2",
  key: "renown",
  name: "Renown",
  valueType: "PROGRESS"
};

describe("TrackerCell", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cycles a BOOLEAN tracker unknown -> false, calling setTrackerValue for the exact character and definition", async () => {
    const onChanged = vi.fn();

    render(
      <TrackerCell
        characterId="char-1"
        definition={booleanDefinition}
        onChanged={onChanged}
        trackerState={undefined}
      />
    );

    fireEvent.click(
      screen.getByRole("button")
    );

    await vi.waitFor(() => {
      expect(setTrackerValue).toHaveBeenCalledWith(
        "tracker-1",
        "char-1",
        { valueType: "BOOLEAN", boolean: false }
      );
    });

    expect(onChanged).toHaveBeenCalled();
  });

  it("cycles a BOOLEAN tracker true -> clear, returning the cell to UNKNOWN rather than looping back to false", async () => {
    const onChanged = vi.fn();

    render(
      <TrackerCell
        characterId="char-1"
        definition={booleanDefinition}
        onChanged={onChanged}
        trackerState={{
          trackerDefinitionId: "tracker-1",
          characterId: "char-1",
          periodKey: "ALWAYS",
          state: "RECORDED",
          source: "MANUAL",
          value: { valueType: "BOOLEAN", boolean: true }
        }}
      />
    );

    fireEvent.click(
      screen.getByRole("button")
    );

    await vi.waitFor(() => {
      expect(clearTrackerValue).toHaveBeenCalledWith(
        "tracker-1",
        "char-1"
      );
    });

    expect(setTrackerValue).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();
  });

  it("edits a PROGRESS tracker inline and saves against the exact character and definition, never a different character's", async () => {
    const onChanged = vi.fn();

    render(
      <TrackerCell
        characterId="char-2"
        definition={progressDefinition}
        onChanged={onChanged}
        trackerState={undefined}
      />
    );

    fireEvent.click(
      screen.getByRole("button")
    );

    fireEvent.change(
      screen.getByLabelText("Current"),
      { target: { value: "2" } }
    );

    fireEvent.change(
      screen.getByLabelText("Total"),
      { target: { value: "4" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Save" })
    );

    await vi.waitFor(() => {
      expect(setTrackerValue).toHaveBeenCalledWith(
        "tracker-2",
        "char-2",
        {
          valueType: "PROGRESS",
          current: 2,
          total: 4
        }
      );
    });

    expect(onChanged).toHaveBeenCalled();
  });
});
