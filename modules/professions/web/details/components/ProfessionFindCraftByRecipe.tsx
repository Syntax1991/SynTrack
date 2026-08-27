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
import type {
  ProfessionCharacterCoverage,
  ProfessionDetail
} from "../types/professionDetail.types";
import { EntityIcon } from "../../shared/components/ProfessionIcons";
import type {
  QualityFilterOption
} from "../utils/professionItemQuality.helpers";
import {
  getItemQualityColor,
  matchesQualityFilter
} from "../utils/professionItemQuality.helpers";
import { ProfessionFindCraftCandidateRow } from "./ProfessionFindCraftCandidateRow";
import { ProfessionFindCraftRecipeList } from "./ProfessionFindCraftRecipeList";
import {
  getFindCraftRecipeSubtitle,
  matchesFindCraftQuery
} from "./professionFindCraftByRecipe.helpers";

type ProfessionFindCraftByRecipeProps = {
  detail: ProfessionDetail;
  professionId: string;
  qualityFilter: QualityFilterOption;
};

export function ProfessionFindCraftByRecipe({
  detail,
  professionId,
  qualityFilter
}: ProfessionFindCraftByRecipeProps) {
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
  ] = useState("");

  const [
    selectedRecipeId,
    setSelectedRecipeId
  ] =
    useState<string | null>(
      null
    );

  const matchingRecipes =
    useMemo(
      () =>
        (catalog?.items ?? []).filter(
          (recipe) =>
            matchesFindCraftQuery(
              recipe,
              query
            ) &&
            matchesQualityFilter(
              recipe,
              qualityFilter
            )
        ),
      [
        catalog,
        query,
        qualityFilter
      ]
    );

  const selectedRecipe =
    matchingRecipes.find(
      (recipe) =>
        recipe.id ===
        selectedRecipeId
    ) ??
    matchingRecipes[0] ??
    null;

  const selectedRecipeQualityColor =
    getItemQualityColor(
      selectedRecipe?.itemQuality ??
        null
    );

  const coverageByCharacterId =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            ProfessionCharacterCoverage
          >();

        for (
          const coverage of
          detail.characters
        ) {
          map.set(
            coverage.character.id,
            coverage
          );
        }

        return map;
      },
      [detail.characters]
    );

  if (error) {
    return (
      <StatusMessage type="error">
        {error}
      </StatusMessage>
    );
  }

  if (isLoading || !catalog) {
    return <LoadingPanel />;
  }

  const candidates =
    selectedRecipe
      ? [...selectedRecipe.crafters].sort(
          (left, right) =>
            left.name.localeCompare(
              right.name,
              "en"
            )
        )
      : [];

  return (
    <div className="profession-find-craft-by-recipe">
      <label className="profession-find-craft-search">
        <span>
          Search recipe or item
        </span>

        <input
          onChange={
            (event) => {
              setQuery(
                event.target.value
              );
              setSelectedRecipeId(
                null
              );
            }
          }
          placeholder="Recipe or item name..."
          type="search"
          value={query}
        />
      </label>

      <div className="profession-find-craft-layout">
        <ProfessionFindCraftRecipeList
          onSelect={
            setSelectedRecipeId
          }
          recipes={matchingRecipes}
          selectedRecipeId={
            selectedRecipe?.id ??
            null
          }
        />

        <div className="profession-find-craft-detail">
          {!selectedRecipe ? (
            <div className="empty-state">
              Select a recipe to
              compare crafters.
            </div>
          ) : (
            <>
              <header className="profession-find-craft-recipe-header">
                <EntityIcon
                  iconUrl={
                    selectedRecipe.iconUrl
                  }
                  kind="recipe"
                  name={
                    selectedRecipe.name
                  }
                  qualityColor={
                    selectedRecipeQualityColor
                  }
                />

                <div>
                  <h3
                    style={
                      selectedRecipeQualityColor
                        ? {
                            color:
                              selectedRecipeQualityColor
                          }
                        : undefined
                    }
                  >
                    {
                      selectedRecipe.name
                    }
                  </h3>

                  <span>
                    {
                      getFindCraftRecipeSubtitle(
                        selectedRecipe
                      )
                    }
                  </span>
                </div>
              </header>

              {candidates.length ===
              0 ? (
                <div className="empty-state">
                  No captured character
                  knows this recipe yet.
                </div>
              ) : (
                <div className="profession-find-craft-candidates">
                  <div className="profession-find-craft-candidate-header">
                    <span>Crafter</span>
                    <span>Specialization</span>
                    <span>Capability</span>
                  </div>

                  {candidates.map(
                    (crafter) => (
                      <ProfessionFindCraftCandidateRow
                        crafter={
                          crafter
                        }
                        key={
                          crafter.characterId
                        }
                        recipe={
                          selectedRecipe
                        }
                        specializationEquipment={
                          coverageByCharacterId.get(
                            crafter.characterId
                          )
                            ?.specializationEquipment ??
                            []
                        }
                        specializationMappingAvailable={
                          detail
                            .specializationMappingAvailable
                        }
                      />
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
