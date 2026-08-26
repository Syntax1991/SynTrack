import type { ProfessionCharacterCoverage } from "../types/professionDetail.types";
import { EntityIcon } from "../../shared/components/ProfessionIcons";
import { SynTrackTooltip } from "../../shared/components/SynTrackTooltip";
import { SpecializationTooltipContent } from "../../shared/components/ProfessionTooltipContent";
import { groupExplicitSlotNodeRanksByFamily } from "../utils/professionExplicitSlotNodeRank.helpers";

type ProfessionSpecializationCharacterProps = {
  coverage: ProfessionCharacterCoverage;
  specializationMappingAvailable: boolean;
};

export function ProfessionSpecializationCharacter({
  coverage,
  specializationMappingAvailable
}: ProfessionSpecializationCharacterProps) {
  const explicitFamilyGroups =
    specializationMappingAvailable
      ? groupExplicitSlotNodeRanksByFamily(
          coverage
            .explicitSlotNodeRanks
        )
      : [];

  return (
    <article className="profession-specialization-character">
      <header>
        <strong>
          {coverage.character.name}
        </strong>

        <span>
          {coverage.character.className}
          {" · "}
          {coverage.character.realm}
        </span>
      </header>

      <div className="profession-specialization-section">
        <p className="profession-specialization-section-label">
          General
        </p>

        {coverage.generalSpecialization
          .length === 0 ? (
          <p className="profession-specialization-character-empty">
            No specialization
            investment captured yet.
          </p>
        ) : (
          <div className="profession-specialization-general-list">
            {coverage.generalSpecialization.map(
              (entry) => (
                <div
                  className="profession-specialization-general-row"
                  key={entry.nodeKey}
                >
                  <EntityIcon
                    iconUrl={
                      entry.nodeIconUrl
                    }
                    kind="specialization"
                    name={
                      entry.nodeName
                    }
                  />

                  <span>
                    {entry.nodeName}
                  </span>

                  <span className="profession-specialization-claim-rank">
                    {entry.rank}
                    {
                      entry.maxRank !==
                      null
                        ? `/${entry.maxRank}`
                        : ""
                    }
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="profession-specialization-section">
        <p className="profession-specialization-section-label">
          Equipment
        </p>

        {!specializationMappingAvailable ? (
          <p className="profession-specialization-character-empty">
            SynTrack does not yet have
            a verified equipment
            specialization ID mapping
            for this profession.
          </p>
        ) : explicitFamilyGroups.length ===
          0 ? (
          <p className="profession-specialization-character-empty">
            No verified equipment
            specialization data
            available.
          </p>
        ) : (
          <div className="profession-specialization-family-groups">
            {explicitFamilyGroups.map(
              (familyGroup) => (
                <div
                  className="profession-specialization-family-group"
                  key={
                    familyGroup.presentationGroup
                  }
                >
                  <p className="profession-specialization-family-name">
                    {
                      familyGroup.presentationGroup
                    }
                  </p>

                  <div className="profession-specialization-claim-list">
                    <div className="profession-specialization-claim-header">
                      <span>Slot</span>
                      <span>Node</span>
                      <span>Rank</span>
                    </div>

                    {familyGroup.slots.map(
                      (slot) => (
                        <div
                          className={
                            slot.rank >
                            0
                              ? "profession-specialization-claim"
                              : "profession-specialization-claim uninvested"
                          }
                          key={
                            slot.slotKey
                          }
                        >
                          <span className="profession-specialization-claim-applies-to">
                            {
                              slot.slotName
                            }
                          </span>

                          <SynTrackTooltip
                            content={
                              <SpecializationTooltipContent
                                characterName={
                                  coverage
                                    .character
                                    .name
                                }
                                group={{
                                  nodeKey:
                                    slot.nodeKey,
                                  nodeName:
                                    slot.nodeName,
                                  nodeIconUrl:
                                    slot.nodeIconUrl,
                                  rank: slot.rank,
                                  maxRank:
                                    slot.maxRank,
                                  presentationGroup:
                                    slot.presentationGroup,
                                  familyName:
                                    slot.familyName,
                                  slotNames:
                                    [
                                      slot.slotName
                                    ],
                                  slotKeys:
                                    [
                                      slot.slotKey
                                    ],
                                  familyNames:
                                    [
                                      slot.familyName
                                    ]
                                }}
                              />
                            }
                          >
                            <span className="profession-specialization-claim-node">
                              <EntityIcon
                                iconUrl={
                                  slot.nodeIconUrl
                                }
                                kind="specialization"
                                name={
                                  slot.nodeName
                                }
                              />

                              {
                                slot.nodeName
                              }
                            </span>
                          </SynTrackTooltip>

                          <span className="profession-specialization-claim-rank">
                            {slot.rank}
                            {
                              slot.maxRank !==
                              null
                                ? `/${slot.maxRank}`
                                : ""
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}
