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
import type { ProfessionDetail } from "../types/professionDetail.types";
import type {
  QualityFilterOption
} from "../utils/professionItemQuality.helpers";
import { filterRecipesByQuality } from "../utils/professionItemQuality.helpers";
import { ProfessionFindCraftGroupPicker } from "./ProfessionFindCraftGroupPicker";
import { ProfessionFindCraftSlotPicker } from "./ProfessionFindCraftSlotPicker";
import { ProfessionFindCraftBrowseCandidateList } from "./ProfessionFindCraftBrowseCandidateList";
import { ProfessionFindCraftScopedRecipes } from "./ProfessionFindCraftScopedRecipes";
import {
  computeBrowseCandidates,
  computeBrowseGroupOptions,
  computeBrowseSlotOptions,
  getRecipesForFamilySlot,
  getRecipesForGroup
} from "./professionFindCraftBrowse.helpers";

type ProfessionFindCraftBrowseProps = {
  detail: ProfessionDetail;
  professionId: string;
  initialFamilyName?: string | null;
  initialSlotKey?: string | null;
  qualityFilter: QualityFilterOption;
};

export function ProfessionFindCraftBrowse({
  detail,
  professionId,
  initialFamilyName = null,
  initialSlotKey = null,
  qualityFilter
}: ProfessionFindCraftBrowseProps) {
  const {
    catalog,
    isLoading,
    error
  } =
    useProfessionRecipes(
      professionId
    );

  const [
    selectedGroup,
    setSelectedGroup
  ] =
    useState<string | null>(
      initialFamilyName
    );

  const [
    selectedSlotKey,
    setSelectedSlotKey
  ] =
    useState<string | null>(
      initialSlotKey
    );

  /*
   * Filtered once, here - every downstream computation (group/slot
   * counts, scoped recipes, candidate counts) derives from this same
   * filtered set, so nothing needs its own separate filtering rule and
   * candidate counts can never include a recipe Epic-only excluded.
   */
  const recipes =
    filterRecipesByQuality(
      catalog?.items ?? [],
      qualityFilter
    );

  const groupOptions =
    useMemo(
      () =>
        computeBrowseGroupOptions(
          recipes
        ),
      [recipes]
    );

  const selectedGroupOption =
    groupOptions.find(
      (option) =>
        option.name ===
        selectedGroup
    ) ?? null;

  const slotOptions =
    useMemo(
      () =>
        selectedGroupOption?.isArmorFamily
          ? computeBrowseSlotOptions(
              recipes,
              selectedGroupOption.name
            )
          : [],
      [
        recipes,
        selectedGroupOption
      ]
    );

  const scopedRecipes =
    useMemo(
      () => {
        if (
          !selectedGroupOption
        ) {
          return [];
        }

        if (
          selectedGroupOption.isArmorFamily
        ) {
          return selectedSlotKey
            ? getRecipesForFamilySlot(
                recipes,
                selectedGroupOption.name,
                selectedSlotKey
              )
            : [];
        }

        return getRecipesForGroup(
          recipes,
          selectedGroupOption.name
        );
      },
      [
        recipes,
        selectedGroupOption,
        selectedSlotKey
      ]
    );

  const candidates =
    useMemo(
      () =>
        computeBrowseCandidates(
          scopedRecipes
        ),
      [scopedRecipes]
    );

  const coverageByCharacterId =
    useMemo(
      () =>
        new Map(
          detail.characters.map(
            (coverage) => [
              coverage.character
                .id,
              coverage
            ]
          )
        ),
      [detail.characters]
    );

  function selectGroup(
    name: string
  ) {
    setSelectedGroup(
      name === selectedGroup
        ? null
        : name
    );
    setSelectedSlotKey(null);
  }

  function selectSlot(
    slotKey: string
  ) {
    setSelectedSlotKey(
      slotKey === selectedSlotKey
        ? null
        : slotKey
    );
  }

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

  const showCandidates =
    selectedGroupOption &&
    (
      !selectedGroupOption.isArmorFamily ||
      selectedSlotKey
    );

  const selectedSlotName =
    slotOptions.find(
      (option) =>
        option.slotKey ===
        selectedSlotKey
    )?.slotName ?? "";

  const slotContext =
    selectedGroupOption?.isArmorFamily &&
    selectedSlotKey
      ? {
          familyName:
            selectedGroupOption.name,
          slotKey: selectedSlotKey
        }
      : null;

  return (
    <div className="profession-find-craft-browse">
      <p className="profession-find-craft-browse-step-label">
        Category
      </p>

      <ProfessionFindCraftGroupPicker
        onSelect={selectGroup}
        options={groupOptions}
        selected={selectedGroup}
      />

      {selectedGroupOption?.isArmorFamily && (
        <>
          <p className="profession-find-craft-browse-step-label">
            Slot
          </p>

          <ProfessionFindCraftSlotPicker
            onSelect={selectSlot}
            options={slotOptions}
            selected={
              selectedSlotKey
            }
          />
        </>
      )}

      {showCandidates && (
        <>
          <p className="profession-find-craft-browse-step-label">
            {selectedGroupOption.name}
            {selectedSlotName
              ? ` · ${selectedSlotName}`
              : ""}
          </p>

          <ProfessionFindCraftBrowseCandidateList
            candidates={candidates}
            coverageByCharacterId={
              coverageByCharacterId
            }
            specializationMappingAvailable={
              detail
                .specializationMappingAvailable
            }
            slotContext={
              slotContext
            }
          />

          <p className="profession-find-craft-browse-step-label">
            Recipes
          </p>

          <ProfessionFindCraftScopedRecipes
            key={
              `${selectedGroup}-${selectedSlotKey}`
            }
            recipes={scopedRecipes}
          />
        </>
      )}
    </div>
  );
}
