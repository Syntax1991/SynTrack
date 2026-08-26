import { Link } from "react-router-dom";
import type {
  ProfessionOverviewItem
} from "../types/professionDetail.types";
import { FamilyIcon } from "../../shared/components/ProfessionIcons";
import { getProfessionOverviewRowPresentation } from "../utils/professionOverviewPresentation";

type ProfessionOverviewRowProps = {
  profession: ProfessionOverviewItem;
};

/*
 * One profession = one compact full-row click target. No exact
 * Blizzard-backed profession icon exists in the current data model
 * (audited: neither the Profession table nor ProfessionOverviewItem
 * has an icon field, and this task does not expand into a new API/
 * schema project to add one) - FamilyIcon's existing neutral glyph
 * fallback (a stable 2-letter initial, never a guessed picture) is
 * reused here rather than inventing a new icon component.
 */
export function ProfessionOverviewRow({
  profession
}: ProfessionOverviewRowProps) {
  const presentation =
    getProfessionOverviewRowPresentation(
      profession
    );

  return (
    <Link
      className="profession-overview-row"
      to={
        `/professions/${profession.id}`
      }
    >
      <span className="profession-overview-row-identity">
        <FamilyIcon
          familyName={
            profession.name
          }
        />

        <h3>
          {profession.name}
        </h3>
      </span>

      <span className="profession-overview-row-meta">
        {presentation.isTracked ? (
          <>
            <span>
              {
                presentation.countsLine
              }
            </span>

            {presentation.attentionLine && (
              <span className="profession-overview-row-meta-attention">
                {
                  presentation.attentionLine
                }
              </span>
            )}

            {presentation.updatedLine && (
              <span className="profession-overview-row-meta-updated">
                {
                  presentation.updatedLine
                }
              </span>
            )}
          </>
        ) : (
          <span className="profession-overview-row-not-tracked">
            Not tracked
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className="profession-overview-row-arrow"
      >
        →
      </span>
    </Link>
  );
}
