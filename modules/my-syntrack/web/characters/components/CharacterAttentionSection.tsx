import { Link } from "react-router-dom";
import type { CharacterWeeklyState } from "../../overview/types/overview.types";

type CharacterAttentionSectionProps = {
  character: CharacterWeeklyState;
};

/*
 * Renders the existing AttentionItem[]/nextAction exactly as Overview
 * already derives them - no new character-task model, no re-scoring.
 */
export function CharacterAttentionSection({
  character
}: CharacterAttentionSectionProps) {
  if (character.attentionItems.length === 0) {
    return (
      <section className="character-detail-section">
        <h2>Needs attention</h2>

        <p className="character-detail-clear">
          {character.readinessState ===
          "unknown"
            ? "No action can be derived yet; some domains are unknown or untracked."
            : "Nothing needs attention right now."}
        </p>
      </section>
    );
  }

  return (
    <section className="character-detail-section">
      <h2>Needs attention</h2>

      <ul className="character-attention-list">
        {character.attentionItems.map(
          (item) => (
            <li key={item.id}>
              <Link
                className={
                  character.nextAction
                    ?.label ===
                    item.label &&
                  character.nextAction
                    ?.domain ===
                    item.domain
                    ? "character-attention-item is-next"
                    : "character-attention-item"
                }
                to={item.path}
              >
                <strong>
                  {item.label}
                </strong>

                {item.detail && (
                  <span>
                    {item.detail}
                  </span>
                )}
              </Link>
            </li>
          )
        )}
      </ul>
    </section>
  );
}
