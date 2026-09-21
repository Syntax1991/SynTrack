import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type { CellToken } from "../../../../../apps/web/src/shared/types/cellToken";
import type {
  ProfessionOverviewItem
} from "../types/professionDetail.types";
import { WowProfessionIcon } from "../../../../../apps/web/src/shared/components/WowProfessionIcon";
import { getProfessionOverviewRowPresentation } from "../utils/professionOverviewPresentation";

type ProfessionOverviewRowProps = {
  profession: ProfessionOverviewItem;
};

function getStatusToken(
  profession: ProfessionOverviewItem
): CellToken {
  const updated =
    profession.lastCapturedAt
      ? ` Last captured ${new Date(
          profession.lastCapturedAt
        ).toLocaleString("en-GB")}.`
      : "";

  if (profession.characterCount === 0) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "Not tracked"
    };
  }

  if (
    profession.category ===
    "GATHERING"
  ) {
    return {
      symbol: "✓",
      tone: "ready",
      title:
        "Assigned; specialization capture is not required for Gathering."
    };
  }

  if (
    profession.captureStatus ===
    "NOT_CAPTURED"
  ) {
    return {
      symbol: "!",
      tone: "attention",
      title: "Profession import needed"
    };
  }

  if (
    profession.trackedCharacterCount <
    profession.characterCount
  ) {
    const missing =
      profession.characterCount -
      profession.trackedCharacterCount;

    return {
      symbol: "!",
      tone: "attention",
      title:
        `${missing} ${missing === 1 ? "character needs" : "characters need"} specialization data.${updated}`
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title:
      `Tracked with no known issues.${updated}`
  };
}

/*
 * One profession = one compact full-row click target. The profession
 * icon is the Blizzard Game Data media URL keyed by catalog profession
 * key (resolved server-side). Missing URLs fall back to a 2-letter
 * glyph - never a guessed CDN filename.
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
        <WowProfessionIcon
          name={profession.name}
          professionKey={profession.key}
        />

        <h3>
          {profession.name}
        </h3>
      </span>

      <span className="profession-overview-count">
        {presentation.isTracked
          ? profession.characterCount
          : "—"}
      </span>

      <span className="profession-overview-count">
        {profession.category ===
          "GATHERING" ||
        !presentation.isTracked
          ? "—"
          : profession.trackedCharacterCount}
      </span>

      <span className="profession-overview-status">
        <StatusToken
          token={getStatusToken(
            profession
          )}
        />
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
