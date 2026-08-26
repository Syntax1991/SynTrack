import {
  useMemo,
  useState
} from "react";
import type {
  ProfessionRecipeCraftStatus
} from "../types/professionRecipe.types";
import {
  ProfessionCrafterRecipeTable
} from "./ProfessionCrafterRecipeTable";
import {
  getCrafterGroups,
  matchesCrafterRecipeQuery
} from "./professionCrafterView.helpers";
import type {
  ProfessionCrafterSummary
} from "./professionCrafterView.helpers";

type StatusFilter =
  | "ALL"
  | ProfessionRecipeCraftStatus;

export function ProfessionCrafterCharacterPanel({
  specializationMappingAvailable,
  summary
}: {
  specializationMappingAvailable: boolean;
  summary:
    ProfessionCrafterSummary;
}) {
  const [
    query,
    setQuery
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter
  ] =
    useState<StatusFilter>(
      "ALL"
    );

  const [
    groupFilter,
    setGroupFilter
  ] =
    useState(
      "ALL"
    );

  const entries =
    summary.entries;

  const groups =
    useMemo(
      () =>
        getCrafterGroups(
          entries
        ),
      [
        entries
      ]
    );

  const activeGroup =
    groupFilter === "ALL" ||
    groups.includes(
      groupFilter
    )
      ? groupFilter
      : "ALL";

  const filteredEntries =
    useMemo(
      () =>
        entries.filter(
          (entry) =>
            (
              activeGroup ===
                "ALL" ||
              entry.group ===
                activeGroup
            ) &&
            (
              statusFilter ===
                "ALL" ||
              entry.crafter
                .craftStatus ===
                statusFilter
            ) &&
            matchesCrafterRecipeQuery(
              entry,
              query
            )
        ),
      [
        activeGroup,
        entries,
        query,
        statusFilter
      ]
    );

  return (
    <>
      <section className="profession-crafter-toolbar">
        <p className="profession-crafter-toolbar-summary">
          <strong>
            {entries.length}
          </strong>
          {" recipes · "}
          <strong>
            {summary.safeCount}
          </strong>
          {" no-conc · "}
          <strong>
            {filteredEntries.length}
          </strong>
          {" shown"}
        </p>

        <label>
          <span>
            Search
          </span>

          <input
            onChange={
              (event) =>
                setQuery(
                  event.target.value
                )
            }
            placeholder="Recipe or category..."
            type="search"
            value={query}
          />
        </label>

        <label>
          <span>
            Craft result
          </span>

          <select
            onChange={
              (event) =>
                setStatusFilter(
                  event.target
                    .value as
                    StatusFilter
                )
            }
            value={statusFilter}
          >
            <option value="ALL">
              All
            </option>

            <option value="SAFE">
              No Concentration
            </option>

            <option value="CONCENTRATION">
              Needs Concentration
            </option>

            <option value="NOT_SAFE">
              Cannot Reach
            </option>

            <option value="UNKNOWN">
              Unknown
            </option>
          </select>
        </label>
      </section>

      <div className="profession-crafter-groups">
        <button
          className={
            activeGroup ===
            "ALL"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setGroupFilter(
                "ALL"
              )
          }
          type="button"
        >
          All

          <span>
            {entries.length}
          </span>
        </button>

        {groups.map(
          (group) => {
            const count =
              entries.filter(
                (entry) =>
                  entry.group ===
                  group
              ).length;

            return (
              <button
                className={
                  activeGroup ===
                  group
                    ? "active"
                    : ""
                }
                key={group}
                onClick={
                  () =>
                    setGroupFilter(
                      group
                    )
                }
                type="button"
              >
                {group}

                <span>
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      <ProfessionCrafterRecipeTable
        entries={
          filteredEntries
        }
        specializationEquipment={
          summary.coverage
            .specializationEquipment
        }
        specializationMappingAvailable={
          specializationMappingAvailable
        }
      />
    </>
  );
}
