import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SeasonGoalDefinition } from "../types/seasonGoalPreference.types.js";
import { SeasonGoalRow } from "./SeasonGoalRow.js";

const scoreDefinition: SeasonGoalDefinition = {
  key: "mythic-plus-score",
  label: "Mythic+ Score",
  detail: "Current-season Mythic+ rating toward your chosen milestone",
  scope: "CHARACTER",
  targetType: "NUMBER",
  defaultEnabled: true,
  defaultNumericTarget: 2000,
  defaultEnumTarget: null,
  numericPresets: [2000, 2500, 3000],
  enumOptions: null,
  minNumericTarget: 1
};

describe("SeasonGoalRow numeric draft", () => {
  it("does not save while typing a custom Mythic+ score; commits on blur", () => {
    const onChange = vi.fn();

    render(
      <SeasonGoalRow
        definition={scoreDefinition}
        isOverridden={false}
        onChange={onChange}
        onReset={vi.fn()}
        value={{
          enabled: true,
          numericTarget: 2000,
          enumTarget: null
        }}
      />
    );

    const input = screen.getByRole("textbox", {
      name: "Mythic+ Score target"
    });

    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.change(input, { target: { value: "31" } });
    fireEvent.change(input, { target: { value: "315" } });
    fireEvent.change(input, { target: { value: "3150" } });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("3150");

    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      enabled: true,
      numericTarget: 3150,
      enumTarget: null
    });
  });

  it("saves a preset chip immediately", () => {
    const onChange = vi.fn();

    render(
      <SeasonGoalRow
        definition={scoreDefinition}
        isOverridden={false}
        onChange={onChange}
        onReset={vi.fn()}
        value={{
          enabled: true,
          numericTarget: 2000,
          enumTarget: null
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "2500" }));

    expect(onChange).toHaveBeenCalledWith({
      enabled: true,
      numericTarget: 2500,
      enumTarget: null
    });
  });

  it("reverts an empty draft on blur instead of saving null", () => {
    const onChange = vi.fn();

    render(
      <SeasonGoalRow
        definition={scoreDefinition}
        isOverridden={false}
        onChange={onChange}
        onReset={vi.fn()}
        value={{
          enabled: true,
          numericTarget: 2000,
          enumTarget: null
        }}
      />
    );

    const input = screen.getByRole("textbox", {
      name: "Mythic+ Score target"
    });

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
  });
});
