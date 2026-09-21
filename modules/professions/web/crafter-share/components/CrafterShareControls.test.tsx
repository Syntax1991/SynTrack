import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrafterShareControls } from "./CrafterShareControls";

const getCrafterShareStatus = vi.fn();
const enableCrafterShare = vi.fn();
const disableCrafterShare = vi.fn();

vi.mock("../api/crafterShareApi", () => ({
  getCrafterShareStatus: () => getCrafterShareStatus(),
  enableCrafterShare: () => enableCrafterShare(),
  disableCrafterShare: () => disableCrafterShare()
}));

describe("CrafterShareControls", () => {
  beforeEach(() => {
    getCrafterShareStatus.mockReset();
    enableCrafterShare.mockReset();
    disableCrafterShare.mockReset();
    getCrafterShareStatus.mockResolvedValue({
      enabled: false,
      publicUrl: null
    });
  });

  it("starts disabled and shows the public URL after enable", async () => {
    const publicUrl = `https://syntrack.io/c/${"a".repeat(32)}`;

    enableCrafterShare.mockResolvedValue({
      enabled: true,
      publicUrl
    });

    render(<CrafterShareControls />);

    expect(
      await screen.findByRole("button", { name: "Enable sharing" })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Enable sharing" })
    );

    expect(await screen.findByText(publicUrl)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Stop sharing" })
    ).toBeInTheDocument();
    expect(enableCrafterShare).toHaveBeenCalledTimes(1);
  });
});
