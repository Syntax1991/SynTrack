import type { ProfessionDetail } from "../types/professionDetail.types";
import { ClassIcon } from "../../shared/components/ProfessionIcons";
import { SynTrackTooltip } from "../../shared/components/SynTrackTooltip";
import { CharacterTooltipContent } from "../../shared/components/ProfessionTooltipContent";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { ProfessionSpecializationCharacter } from "./ProfessionSpecializationCharacter";

type ProfessionSpecializationsWorkspaceProps = {
  detail: ProfessionDetail;
  initialCharacterId?: string | null;
};

/*
 * The dedicated place for KP-allocation TRUTH. Distinguishes two
 * genuinely separate facts, both ID-derived, neither guessed from a
 * node name/description:
 *   - General/tree investment (generalSpecialization - root nodes,
 *     e.g. "Flawless Fortes 30/30") - proves overall KP allocation
 *     exists even when no armor-family/slot mapping applies.
 *   - Equipment-slot specialization (specializationEquipment, grouped
 *     by node) - the narrower, curated Leather/Mail claim used for
 *     recipe matching.
 * A character with only general investment (e.g. Synbomb) is real
 * and specialized in the general sense - never shown as globally
 * "not specialized".
 */
export function ProfessionSpecializationsWorkspace({
  detail,
  initialCharacterId = null
}: ProfessionSpecializationsWorkspaceProps) {
  const characters =
    [
      ...detail.characters
    ].sort(
      (left, right) =>
        left.character.name.localeCompare(
          right.character.name,
          "en"
        )
    );

  const {
    selectedCoverage,
    selectedCharacterId,
    setSelectedCharacterId
  } =
    useSelectedCharacter(
      characters,
      initialCharacterId
    );

  return (
    <section className="profession-specialization-workspace">
      <div className="profession-specialization-picker">
        {characters.map(
          (coverage) => (
            <SynTrackTooltip
              content={
                <CharacterTooltipContent
                  coverage={
                    coverage
                  }
                />
              }
              key={
                coverage
                  .characterProfessionId
              }
            >
              <button
                className={
                  coverage.character
                    .id ===
                  selectedCharacterId
                    ? "active"
                    : ""
                }
                onClick={
                  () =>
                    setSelectedCharacterId(
                      coverage
                        .character.id
                    )
                }
                type="button"
              >
                <ClassIcon
                  className={
                    coverage
                      .character
                      .className
                  }
                />

                {
                  coverage.character
                    .name
                }
              </button>
            </SynTrackTooltip>
          )
        )}
      </div>

      {selectedCoverage && (
        <ProfessionSpecializationCharacter
          coverage={
            selectedCoverage
          }
          specializationMappingAvailable={
            detail
              .specializationMappingAvailable
          }
        />
      )}
    </section>
  );
}
