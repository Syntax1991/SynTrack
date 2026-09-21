import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicCrafterSharePage } from "./PublicCrafterSharePage";
import type { PublicCrafterShareCard } from "../types/crafterShare.types";

const getPublicCrafterShareCard = vi.fn();

vi.mock("../api/crafterShareApi", () => ({
  getPublicCrafterShareCard: (token: string) =>
    getPublicCrafterShareCard(token)
}));

const token = "a".repeat(32);

const card: PublicCrafterShareCard = {
  battleTag: "Syn#1234",
  characters: [
    {
      name: "Synblast",
      realm: "Antonidas",
      className: "Shaman",
      professions: [
        {
          name: "Blacksmithing",
          recipes: [
            {
              name: "Scout's Scaled Bracers",
              itemQuality: "EPIC",
              itemLevel: 331,
              iconUrl: null,
              resultQuality: 5,
              craftStatus: "SAFE",
              slotName: "Mail Wrist"
            },
            {
              name: "Blood-Tempered Bracers",
              itemQuality: "RARE",
              itemLevel: 331,
              iconUrl: null,
              resultQuality: 5,
              craftStatus: "SAFE",
              slotName: "Wrist"
            },
            {
              name: "Scout's Loam Bracers",
              itemQuality: "EPIC",
              itemLevel: 197,
              iconUrl: null,
              resultQuality: 3,
              craftStatus: "NOT_SAFE",
              slotName: "Wrist"
            },
            {
              name: "Green Flask",
              itemQuality: "UNCOMMON",
              itemLevel: 90,
              iconUrl: null,
              resultQuality: 3,
              craftStatus: "SAFE",
              slotName: null
            }
          ]
        }
      ]
    }
  ]
};

function renderCard() {
  return render(
    <MemoryRouter initialEntries={[`/c/${token}`]}>
      <Routes>
        <Route
          element={<PublicCrafterSharePage />}
          path="c/:token"
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicCrafterSharePage", () => {
  beforeEach(() => {
    getPublicCrafterShareCard.mockReset();
  });

  it("renders crafts for a public token without requiring login", async () => {
    getPublicCrafterShareCard.mockResolvedValue(card);

    renderCard();

    expect(await screen.findByText("Syn#1234")).toBeInTheDocument();
    expect(screen.getByText("Synblast")).toBeInTheDocument();
    expect(
      screen.getByText("Scout's Scaled Bracers")
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Q5/u).length).toBeGreaterThan(0);
    expect(screen.getByText("Scout's Loam Bracers")).toBeInTheDocument();
    expect(screen.getByText(/Q3 · not max/u)).toBeInTheDocument();
    expect(getPublicCrafterShareCard).toHaveBeenCalledWith(token);
  });

  it("shows rare and epic gear by default and hides uncommon until All", async () => {
    getPublicCrafterShareCard.mockResolvedValue(card);

    renderCard();

    expect(
      await screen.findByText("Scout's Scaled Bracers")
    ).toBeInTheDocument();
    expect(screen.getByText("Blood-Tempered Bracers")).toBeInTheDocument();
    expect(screen.queryByText("Green Flask")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("Green Flask")).toBeInTheDocument();
  });

  it("filters to a named item at a listed item level", async () => {
    getPublicCrafterShareCard.mockResolvedValue(card);

    renderCard();

    expect(
      await screen.findByText("Scout's Scaled Bracers")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. bracers"), {
      target: { value: "bracers" }
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 190"), {
      target: { value: "331" }
    });

    expect(screen.getByText("Scout's Scaled Bracers")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. 190"), {
      target: { value: "400" }
    });

    expect(
      screen.getByText("No crafts match these filters.")
    ).toBeInTheDocument();
  });

  it("opens an item tooltip with listed item level on hover", async () => {
    getPublicCrafterShareCard.mockResolvedValue(card);

    renderCard();

    fireEvent.mouseEnter(
      await screen.findByText("Scout's Scaled Bracers")
    );

    expect(
      await screen.findByText("Epic · Item Level 331")
    ).toBeInTheDocument();
  });

  it("shows a generic unavailable state when the card is missing", async () => {
    getPublicCrafterShareCard.mockRejectedValue(
      new Error("This crafter card is not available.")
    );

    renderCard();

    expect(await screen.findByText("Not available")).toBeInTheDocument();
    expect(
      screen.getByText("This crafter card is not available.")
    ).toBeInTheDocument();
  });
});
