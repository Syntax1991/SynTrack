import type { ProfessionSpecializationEquipmentClaim } from "../types/professionDetail.types";
import { ClassIcon } from "../../shared/components/ProfessionIcons";
import { SynTrackTooltip } from "../../shared/components/SynTrackTooltip";
import { CharacterTooltipContent } from "../../shared/components/ProfessionTooltipContent";
import {
  getRecipeSpecializationLabel,
  resolveRecipeSpecializationAlignment
} from "../utils/professionRecipeSpecializationAlignment";
import {
  findSlotSpecializationNodes,
  formatSlotSpecializationNodeLabel
} from "../utils/professionExplicitSlotNodeRank.helpers";
import type { ProfessionCharacterCoverage } from "../types/professionDetail.types";
import type { BrowseCandidate } from "./professionFindCraftBrowse.helpers";
import {
  getCompactCraftLabel,
  getSpecializationClassName
} from "./professionCrafterRecipeTable.helpers";
import type { ProfessionCrafterRecipeEntry } from "./ProfessionCrafterRecipeTable";

type ProfessionFindCraftBrowseCandidateRowProps = {
  candidate: BrowseCandidate;
  coverage: ProfessionCharacterCoverage | undefined;
  specializationEquipment: ProfessionSpecializationEquipmentClaim[];
  specializationMappingAvailable: boolean;
  /*
   * The armor family + slot currently selected in Browse, when known -
   * lets this row show the exact relevant sub-node rank (e.g. "20/20",
   * "0/20") instead of the vague alignment label. null for a non-armor
   * category (e.g. Reagents), where no single slot node applies.
   */
  slotContext: {
    familyName: string;
    slotKey: string;
  } | null;
};

/*
 * Reuses the exact same correctness logic as Search/By Character
 * (resolveRecipeSpecializationAlignment, getCompactCraftLabel) - the
 * representative recipe's own capabilities already prove the exact
 * family+slot this row is scoped to, so no new alignment logic exists
 * here. Candidates are never hidden or reordered by specialization or
 * craft-result state - alphabetical only.
 */
export function ProfessionFindCraftBrowseCandidateRow({
  candidate,
  coverage,
  specializationEquipment,
  specializationMappingAvailable,
  slotContext
}: ProfessionFindCraftBrowseCandidateRowProps) {
  const alignment =
    resolveRecipeSpecializationAlignment(
      candidate.representativeRecipe,
      specializationEquipment,
      specializationMappingAvailable
    );

  const relevantSlotNodes =
    slotContext
      ? findSlotSpecializationNodes(
          coverage
            ?.slotSpecializationNodes ??
            [],
          slotContext.familyName,
          slotContext.slotKey
        )
      : [];

  const entry: ProfessionCrafterRecipeEntry = {
    recipe:
      candidate.representativeRecipe,
    crafter:
      candidate.representativeCrafter,
    group: ""
  };

  return (
    <div className="profession-find-craft-browse-candidate-row">
      {coverage ? (
        <SynTrackTooltip
          content={
            <CharacterTooltipContent
              coverage={coverage}
            />
          }
        >
          <span className="profession-find-craft-browse-candidate-identity">
            <ClassIcon
              className={
                candidate
                  .representativeCrafter
                  .className
              }
            />

            {candidate.characterName}
          </span>
        </SynTrackTooltip>
      ) : (
        <span className="profession-find-craft-browse-candidate-identity">
          <ClassIcon
            className={
              candidate
                .representativeCrafter
                .className
            }
          />

          {candidate.characterName}
        </span>
      )}

      {relevantSlotNodes.length >
      0 ? (
        <span className="profession-find-craft-browse-candidate-nodes">
          {relevantSlotNodes.map(
            (node) => (
              <span
                className={
                  node.rank > 0
                    ? "profession-crafter-specialization specialized"
                    : "profession-crafter-specialization not-specialized"
                }
                key={
                  node.nodeKey
                }
              >
                {
                  formatSlotSpecializationNodeLabel(
                    node
                  )
                }
              </span>
            )
          )}
        </span>
      ) : (
        <span
          className={
            getSpecializationClassName(
              alignment.state
            )
          }
        >
          {
            getRecipeSpecializationLabel(
              alignment
            )
          }
        </span>
      )}

      <span>
        {candidate.knownRecipeCount}
        {
          candidate.knownRecipeCount ===
          1
            ? " known recipe"
            : " known recipes"
        }
      </span>

      <span
        className={
          `profession-crafter-craft-cell ${candidate.representativeCrafter.craftStatus.toLowerCase()}`
        }
      >
        {
          getCompactCraftLabel(
            entry
          )
        }
      </span>
    </div>
  );
}
