import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type { CellToken } from "../../../../../apps/web/src/shared/types/cellToken";
import type { ProfessionOverviewState } from "../../overview/types/overview.types";

type CharacterProfessionsSectionProps = {
  characterId: string;
  professions: ProfessionOverviewState;
};

function toToken(
  dataStatus:
    | "TRACKED"
    | "PARTIAL"
    | "UNTRACKED"
    | "NO_CATALOG"
    | null
): CellToken {
  if (dataStatus === null) {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Profession data status unknown"
    };
  }

  if (dataStatus === "TRACKED") {
    return {
      symbol: "✓",
      tone: "ready",
      title: "Tracked"
    };
  }

  if (dataStatus === "PARTIAL") {
    return {
      symbol: "!",
      tone: "attention",
      title: "Partial data"
    };
  }

  if (dataStatus === "NO_CATALOG") {
    return {
      symbol: "—",
      tone: "not-tracked",
      title:
        "No catalog data exists for this profession yet"
    };
  }

  return {
    symbol: "—",
    tone: "not-tracked",
    title: "Untracked"
  };
}

/*
 * Profession identity only - no specialization tree is copied here.
 * "Open profession"/"Specializations" deep-link into the real,
 * unmodified Professions workspace routes.
 */
export function CharacterProfessionsSection({
  characterId,
  professions
}: CharacterProfessionsSectionProps) {
  return (
    <section className="character-detail-section">
      <h2>Professions</h2>

      {professions.items.length === 0 ? (
        <p className="muted-text">
          No primary professions yet.
        </p>
      ) : (
        <ul className="character-profession-list">
          {professions.items.map((item) => (
            <li
              className="character-profession-row"
              key={item.professionId}
            >
              <span className="character-profession-name">
                {item.name}
              </span>

              <StatusToken
                token={toToken(
                  item.dataStatus
                )}
              />

              <span className="character-profession-progress">
                Skill {item.skill}
                {" · "}
                {item.knowledgePoints} KP
              </span>

              <span className="character-profession-actions">
                <Link
                  className="text-button"
                  to={`/professions/${item.professionId}`}
                >
                  Open profession
                </Link>

                <Link
                  className="text-button"
                  to={`/professions/specializations?profession=${item.professionId}&character=${characterId}`}
                >
                  Specializations
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
