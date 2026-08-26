import { Link } from "react-router-dom";
import type { ProfessionDetail } from "../types/professionDetail.types";
import { ClassIcon, FamilyIcon } from "../../shared/components/ProfessionIcons";
import {
  buildOverviewFamilyGroups,
  buildOverviewGeneralGroups
} from "../utils/professionOverviewGrouping";
import { getUnspecializedCharacterNames } from "../utils/professionSpecializationGrouping";

type ProfessionOverviewResponsibilityTableProps = {
  detail: ProfessionDetail;
  onNavigateToFindCraft?: (
    familyName: string,
    slotKey: string
  ) => void;
};

/*
 * Overview answers exactly one question: who is responsible for what.
 * Grouped PRESENTATION GROUP -> CHARACTER -> slot rows so a character's
 * identity and the section heading are each shown ONCE, followed by
 * every relevant row, instead of repeating them on every line (the
 * previous flat-table design). A multi-slot bundle node (e.g.
 * "Securely Shaped") still appears once with every slot it covers. The
 * heading is buildOverviewFamilyGroups' presentationGroup, not a raw
 * family name - e.g. Blacksmithing's Plate and Shield claims both render
 * under one "Armor" heading (see profession-specialization-equipment
 * .blacksmithing.definitions.ts), and its weapon-type/profession-gear
 * claims render under "Weapons"/"Profession Gear" instead of a fixed
 * "Equipment" label. State shows the factual rank/maxRank investment
 * rather than an invented "Ready" - rank completeness is not the same
 * fact as craft readiness (that remains Craft Result, a separate signal
 * shown in Find Craft).
 *
 * A separate GENERAL / PROFESSION section shows overall tree
 * investment (e.g. Synbomb's "Flawless Fortes 30/30") independent of any
 * curated equipment/weapon/profession-gear specialization - a character
 * with none of the latter is never represented as globally unspecialized
 * if they have real general investment.
 */
export function ProfessionOverviewResponsibilityTable({
  detail,
  onNavigateToFindCraft
}: ProfessionOverviewResponsibilityTableProps) {
  if (
    !detail.specializationMappingAvailable
  ) {
    return (
      <section className="panel">
        <div className="empty-state">
          SynTrack does not yet have a
          verified specialization ID
          mapping for this profession,
          so no responsibility can be
          shown yet.
        </div>
      </section>
    );
  }

  const familyGroups =
    buildOverviewFamilyGroups(
      detail.characters
    );

  const generalGroups =
    buildOverviewGeneralGroups(
      detail.characters
    );

  const unspecializedNames =
    getUnspecializedCharacterNames(
      detail.characters
    );

  if (
    familyGroups.length === 0 &&
    generalGroups.length === 0
  ) {
    return (
      <section className="panel">
        <div className="empty-state">
          No character has a proven
          specialization yet.
        </div>
      </section>
    );
  }

  return (
    <section className="profession-responsibility-table-section">
      {familyGroups.map(
        (familyGroup) => (
          <div
            className="profession-responsibility-family-group"
            key={
              familyGroup.presentationGroup
            }
          >
            <p className="profession-responsibility-family-heading">
              <FamilyIcon
                familyName={
                  familyGroup.presentationGroup
                }
              />

              {
                familyGroup.presentationGroup
              }
            </p>

            {familyGroup.characterGroups.map(
              (characterGroup) => (
                <div
                  className="profession-responsibility-character-group"
                  key={
                    characterGroup.characterId
                  }
                >
                  <Link
                    className="profession-responsibility-character-heading"
                    to={
                      `/characters/${characterGroup.characterId}`
                    }
                  >
                    <ClassIcon
                      className={
                        characterGroup.characterClassName
                      }
                    />

                    {
                      characterGroup.characterName
                    }
                  </Link>

                  <div className="profession-responsibility-slot-rows">
                    {characterGroup.rows.map(
                      (row) => (
                        <div
                          className="profession-responsibility-slot-row"
                          key={
                            row.id
                          }
                        >
                          <button
                            className="profession-responsibility-table-linkish"
                            disabled={
                              !onNavigateToFindCraft
                            }
                            onClick={
                              () =>
                                onNavigateToFindCraft?.(
                                  row.familyName,
                                  row.slotKey
                                )
                            }
                            title="Open in Find Craft"
                            type="button"
                          >
                            {
                              row.slotName
                            }
                          </button>

                          <span className="profession-responsibility-slot-node">
                            {
                              row.nodeName
                            }
                          </span>

                          <span className="profession-responsibility-table-state">
                            {
                              row.rank
                            }
                            {
                              row.maxRank !==
                              null
                                ? `/${row.maxRank}`
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
        )
      )}

      {generalGroups.length >
        0 && (
        <div className="profession-responsibility-family-group">
          <p className="profession-responsibility-family-heading">
            General / Profession
          </p>

          {generalGroups.map(
            (generalGroup) => (
              <div
                className="profession-responsibility-character-group"
                key={
                  generalGroup.characterId
                }
              >
                <Link
                  className="profession-responsibility-character-heading"
                  to={
                    `/characters/${generalGroup.characterId}`
                  }
                >
                  <ClassIcon
                    className={
                      generalGroup.characterClassName
                    }
                  />

                  {
                    generalGroup.characterName
                  }
                </Link>

                <div className="profession-responsibility-slot-rows">
                  {generalGroup.entries.map(
                    (entry) => (
                      <div
                        className="profession-responsibility-slot-row"
                        key={
                          entry.nodeKey
                        }
                      >
                        <span className="profession-responsibility-slot-node">
                          {
                            entry.nodeName
                          }
                        </span>

                        <span className="profession-responsibility-table-state">
                          {
                            entry.rank
                          }
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
              </div>
            )
          )}
        </div>
      )}

      {unspecializedNames.length >
        0 && (
        <p className="profession-responsibility-table-footnote">
          No verified equipment
          specialization:
          {" "}
          {
            unspecializedNames.join(
              ", "
            )
          }
        </p>
      )}
    </section>
  );
}
