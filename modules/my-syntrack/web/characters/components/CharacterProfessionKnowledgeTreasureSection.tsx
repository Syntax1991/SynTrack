import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type { CellToken } from "../../../../../apps/web/src/shared/types/cellToken";
import type {
  ProfessionKnowledgeTreasureAggregate,
  ProfessionKnowledgeTreasureOverviewState
} from "../../overview/types/overview.types";

type CharacterProfessionKnowledgeTreasureSectionProps = {
  professionKnowledgeTreasures: ProfessionKnowledgeTreasureOverviewState;
};

function treasureLabel(
  treasures: ProfessionKnowledgeTreasureAggregate
): string {
  if (treasures.applicableTotal === 0) {
    return "—";
  }

  if (
    treasures.unknownCount > 0 &&
    treasures.completeCount === 0 &&
    treasures.incompleteCount === 0
  ) {
    return "?";
  }

  return `${treasures.completeCount}/${treasures.applicableTotal}`;
}

function treasureToken(
  treasures: ProfessionKnowledgeTreasureAggregate
): CellToken {
  if (treasures.applicableTotal === 0) {
    return {
      symbol: "—",
      tone: "not-tracked",
      title: "No knowledge treasures tracked"
    };
  }

  if (treasures.incompleteCount > 0) {
    return {
      symbol: "!",
      tone: "attention",
      title: `${treasures.incompleteCount} knowledge treasure${
        treasures.incompleteCount === 1 ? "" : "s"
      } missing`
    };
  }

  if (treasures.unknownCount > 0) {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Knowledge treasure evidence incomplete"
    };
  }

  return {
    symbol: "✓",
    tone: "ready",
    title: "All knowledge treasures collected"
  };
}

/*
 * Permanent, once-per-character Knowledge Treasures - shown separately
 * from Profession weekly (Quest/Treatise/Drops). Values come straight
 * from ProfessionKnowledgeTreasureStatusService; no weekly reset.
 */
export function CharacterProfessionKnowledgeTreasureSection({
  professionKnowledgeTreasures
}: CharacterProfessionKnowledgeTreasureSectionProps) {
  if (professionKnowledgeTreasures.professions.length === 0) {
    return (
      <section className="character-detail-section">
        <h2>Permanent Knowledge</h2>

        <p className="muted-text">
          No knowledge treasures tracked yet.
        </p>
      </section>
    );
  }

  return (
    <section className="character-detail-section">
      <h2>Permanent Knowledge</h2>

      <div className="character-profession-treasure-list">
        {professionKnowledgeTreasures.professions.map(
          (profession) => (
            <div
              className="character-profession-treasure-row"
              key={profession.professionKey}
            >
              <span className="character-profession-name">
                {profession.name}
              </span>

              <span>Knowledge Treasures</span>

              <span className="character-profession-treasure-value">
                {treasureLabel(profession.treasures)}
              </span>

              <StatusToken
                token={treasureToken(profession.treasures)}
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}
