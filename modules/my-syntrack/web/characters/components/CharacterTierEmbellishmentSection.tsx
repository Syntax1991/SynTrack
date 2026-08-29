import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type {
  EmbellishmentOverviewState,
  TierOverviewState
} from "../../overview/types/overview.types";
import {
  formatEmbellishmentToken,
  formatTierToken
} from "../../overview/utils/overviewCellFormatting";

type CharacterTierEmbellishmentSectionProps = {
  tier: TierOverviewState;
  embellishments: EmbellishmentOverviewState;
};

function piecesLabel(
  equippedPieces: number,
  targetPieces: number,
  state: TierOverviewState["state"]
): string {
  if (state === "NOT_TRACKED") {
    return "—";
  }

  if (state === "UNKNOWN") {
    return "?";
  }

  return `${equippedPieces}/${targetPieces}`;
}

/*
 * Compact Tier Set + Embellishments hub - same tokens as Overview,
 * no separate gear editor. Values come from Overview character state.
 */
export function CharacterTierEmbellishmentSection({
  tier,
  embellishments
}: CharacterTierEmbellishmentSectionProps) {
  return (
    <section className="character-detail-section">
      <h2>Tier Set & Embellishments</h2>

      <div className="character-tier-embellishment-list">
        <div className="character-tier-embellishment-row">
          <span className="character-profession-name">
            Tier Set
          </span>

          <span>
            {tier.twoPiece ? "2p" : "—"}
            {" / "}
            {tier.fourPiece ? "4p" : "—"}
          </span>

          <span className="character-tier-embellishment-value">
            {piecesLabel(
              tier.equippedPieces,
              tier.targetPieces,
              tier.state
            )}
          </span>

          <StatusToken token={formatTierToken(tier)} />
        </div>

        <div className="character-tier-embellishment-row">
          <span className="character-profession-name">
            Embellishments
          </span>

          <span>Unique category</span>

          <span className="character-tier-embellishment-value">
            {piecesLabel(
              embellishments.equippedPieces,
              embellishments.targetPieces,
              embellishments.state
            )}
          </span>

          <StatusToken
            token={formatEmbellishmentToken(embellishments)}
          />
        </div>
      </div>
    </section>
  );
}
