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
  ProfessionDetail
} from "../types/professionDetail.types";
import type {
  QualityFilterOption
} from "../utils/professionItemQuality.helpers";
import { filterRecipesByQuality } from "../utils/professionItemQuality.helpers";
import {
  ProfessionCrafterCharacterPanel
} from "./ProfessionCrafterCharacterPanel";
import {
  createCrafterSummaries
} from "./professionCrafterView.helpers";

type ProfessionCrafterWorkspaceProps = {
  detail: ProfessionDetail;
  professionId: string;
  qualityFilter: QualityFilterOption;
};

export function ProfessionCrafterWorkspace({
  detail,
  professionId,
  qualityFilter
}: ProfessionCrafterWorkspaceProps) {
  const {
    catalog,
    isLoading,
    error
  } =
    useProfessionRecipes(
      professionId
    );

  const [
    selectedCharacterId,
    setSelectedCharacterId
  ] =
    useState(
      detail.characters[0]
        ?.character.id ??
        ""
    );

  /*
   * Filtered once here, before summaries/entries are built - the same
   * shared predicate Browse/Search use, so specialization/craft-result/
   * concentration data for the remaining recipes is untouched, only the
   * recipe SET is narrowed.
   */
  const summaries =
    useMemo(
      () =>
        createCrafterSummaries(
          detail.characters,
          filterRecipesByQuality(
            catalog?.items ?? [],
            qualityFilter
          )
        ),
      [
        catalog,
        detail.characters,
        qualityFilter
      ]
    );

  const selectedSummary =
    summaries.find(
      (summary) =>
        summary.coverage
          .character.id ===
        selectedCharacterId
    ) ??
    summaries[0] ??
    null;

  return (
    <section className="profession-crafter-workspace">
      <div className="profession-detail-section-heading">
        <div>
          <p className="eyebrow">
            CRAFTER
          </p>

          <h2>
            Who can craft what?
          </h2>
        </div>

        <p>
          Recipe knowledge,
          Specialization alignment and
          craft result are three
          separate signals - a
          character can know a recipe
          without being specialized
          for it.
        </p>
      </div>

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : !catalog ? null : (
        <>
          {summaries.length ===
          0 ? (
            <section className="panel">
              <div className="empty-state">
                This profession currently has
                no assigned crafter.
              </div>
            </section>
          ) : (
            <>
              <section className="panel profession-crafter-picker">
                {summaries.map(
                  (summary) => {
                    const character =
                      summary.coverage
                        .character;

                    const selected =
                      selectedSummary
                        ?.coverage
                        .character.id ===
                      character.id;

                    return (
                      <button
                        className={
                          selected
                            ? "profession-crafter-picker-button active"
                            : "profession-crafter-picker-button"
                        }
                        key={
                          summary.coverage
                            .characterProfessionId
                        }
                        onClick={
                          () =>
                            setSelectedCharacterId(
                              character.id
                            )
                        }
                        type="button"
                      >
                        <span className="profession-crafter-picker-avatar">
                          {
                            character.name
                              .slice(
                                0,
                                2
                              )
                              .toUpperCase()
                          }
                        </span>

                        <span>
                          <strong>
                            {
                              character.name
                            }
                          </strong>

                          <small>
                            {
                              summary.entries
                                .length
                            }
                            {" recipes · "}
                            {
                              summary.safeCount
                            }
                            {" no-conc"}
                          </small>
                        </span>
                      </button>
                    );
                  }
                )}
              </section>

              {selectedSummary && (
                <ProfessionCrafterCharacterPanel
                  key={
                    selectedSummary
                      .coverage
                      .character.id
                  }
                  specializationMappingAvailable={
                    detail
                      .specializationMappingAvailable
                  }
                  summary={
                    selectedSummary
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}