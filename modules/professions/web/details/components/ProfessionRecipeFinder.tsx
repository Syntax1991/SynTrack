import {
  useMemo,
  useState
} from "react";
import {
  LoadingPanel
} from "../../../../../apps/web/src/shared/components/LoadingPanel";
import {
  StatusMessage
} from "../../../../../apps/web/src/shared/components/StatusMessage";
import {
  useProfessionRecipes
} from "../hooks/useProfessionRecipes";
import {
  getRecipeFinderCopy,
  matchesRecipeFilters,
  matchesRecipeFinderMode
} from "../utils/professionRecipeFinder.config";
import type {
  ProfessionRecipeFinderMode
} from "../utils/professionRecipeFinder.config";
import {
  ProfessionRecipeDetailPanel
} from "./ProfessionRecipeDetailPanel";
import {
  ProfessionRecipeList
} from "./ProfessionRecipeList";

type ProfessionRecipeFinderProps = {
  professionId: string;
  mode?: ProfessionRecipeFinderMode;
};

export function ProfessionRecipeFinder({
  professionId,
  mode = "catalog"
}: ProfessionRecipeFinderProps) {
  const {
    catalog,
    isLoading,
    error
  } =
    useProfessionRecipes(
      professionId
    );

  const [
    query,
    setQuery
  ] =
    useState(
      ""
    );

  const [
    onlyCraftable,
    setOnlyCraftable
  ] =
    useState(
      true
    );

  const [
    selectedRecipeId,
    setSelectedRecipeId
  ] =
    useState<
      string | null
    >(
      null
    );

  const copy =
    getRecipeFinderCopy(mode);

  const scopedRecipes =
    useMemo(
      () =>
        catalog?.items.filter(
          (recipe) =>
            matchesRecipeFinderMode(
              recipe,
              mode
            )
        ) ?? [],
      [
        catalog,
        mode
      ]
    );

  const scopedSummary =
    useMemo(
      () => {
        const craftableCount =
          scopedRecipes.filter(
            (recipe) =>
              recipe.crafters.length > 0
          ).length;

        const operationTotals =
          scopedRecipes.reduce(
            (totals, recipe) => ({
              captured:
                totals.captured +
                recipe.operationCoverage
                  .capturedCrafterCount,
              total:
                totals.total +
                recipe.operationCoverage
                  .totalCrafterCount
            }),
            {
              captured: 0,
              total: 0
            }
          );

        return {
          craftableCount,
          missingCount:
            scopedRecipes.length -
            craftableCount,
          operationCoveragePercent:
            operationTotals.total > 0
              ? Math.round(
                  operationTotals.captured /
                    operationTotals.total *
                    100
                )
              : 0
        };
      },
      [scopedRecipes]
    );

  const filteredRecipes =
    useMemo(
      () => {
        return scopedRecipes.filter(
          (recipe) =>
            matchesRecipeFilters(
              recipe,
              query,
              onlyCraftable
            )
        );
      },
      [
        scopedRecipes,
        query,
        onlyCraftable
      ]
    );

  const selectedRecipe =
    filteredRecipes.find(
      (recipe) =>
        recipe.id ===
        selectedRecipeId
    ) ??
    filteredRecipes[0] ??
    null;

  return (
    <section className="profession-recipe-finder-section">
      <div className="profession-detail-section-heading">
        <div>
          <p className="eyebrow">
            {copy.eyebrow}
          </p>

          <h2>
            {copy.title}
          </h2>
        </div>

        <p>
          {copy.description}
        </p>
      </div>

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : catalog ? (
        <>
          <section className="panel profession-recipe-toolbar">
            <div className="profession-recipe-summary">
              <div>
                <span>
                  {copy.metricLabel}
                </span>

                <strong>
                  {scopedRecipes.length}
                </strong>
              </div>

              <div>
                <span>
                  Known
                </span>

                <strong>
                  {scopedSummary.craftableCount}
                </strong>
              </div>

              <div>
                <span>
                  Missing
                </span>

                <strong>
                  {scopedSummary.missingCount}
                </strong>
              </div>

              <div>
                <span>
                  Data
                </span>

                <strong>
                  {
                    scopedSummary
                      .operationCoveragePercent
                  }
                  {"%"}
                </strong>
              </div>
            </div>

            <div className="profession-recipe-filters">
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
                  placeholder="Recipe, group or character..."
                  type="search"
                  value={query}
                />
              </label>

              <label className="profession-recipe-toggle">
                <input
                  checked={
                    onlyCraftable
                  }
                  onChange={
                    (event) =>
                      setOnlyCraftable(
                        event.target.checked
                      )
                  }
                  type="checkbox"
                />

                <span>
                  Known only
                </span>
              </label>
            </div>
          </section>

          <div className="profession-recipe-result-heading">
            <strong>
              {filteredRecipes.length}
            </strong>

            <span>
              {
                filteredRecipes.length ===
                1
                  ? " matching recipe"
                  : " matching recipes"
              }
            </span>
          </div>

          {filteredRecipes.length ===
          0 ? (
            <section className="panel">
              <div className="empty-state">
                {copy.emptyMessage}
              </div>
            </section>
          ) : (
            <div className="profession-recipe-browser">
              <ProfessionRecipeList
                onSelect={
                  setSelectedRecipeId
                }
                recipes={
                  filteredRecipes
                }
                selectedRecipeId={
                  selectedRecipe?.id ??
                  null
                }
              />

              {selectedRecipe && (
                <ProfessionRecipeDetailPanel
                  recipe={
                    selectedRecipe
                  }
                />
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
