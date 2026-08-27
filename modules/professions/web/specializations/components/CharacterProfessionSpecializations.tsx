import type { CharacterProfessionSpecialization } from "../types/specialization.types";
import { SpecializationTreeCard } from "./SpecializationTreeCard";

type CharacterProfessionSpecializationsProps = {
  profession:
    CharacterProfessionSpecialization;
  ranks: Record<string, number>;
  isSaving: boolean;
  onRankChange: (
    nodeId: string,
    rank: number
  ) => void;
  onSave: () => void;
};

export function CharacterProfessionSpecializations({
  profession,
  ranks,
  isSaving,
  onRankChange,
  onSave
}: CharacterProfessionSpecializationsProps) {
  return (
    <section className="profession-specialization-editor">
      <div className="profession-specialization-editor-header">
        <div>
          <p className="eyebrow">
            PROFESSION · {profession.skill} SKILL
          </p>

          <h2>
            {
              profession
                .profession
                .name
            }
          </h2>
        </div>

        <div className="profession-specialization-actions">
          <button
            className="button button-primary"
            disabled={
              isSaving ||
              profession.trees.length === 0
            }
            onClick={
              onSave
            }
            type="button"
          >
            {isSaving
              ? "Saving…"
              : "Save ranks"}
          </button>
        </div>
      </div>

      {profession.trees.length === 0 ? (
        <div className="empty-state">
          There is no
          specialization catalog for this profession yet.
        </div>
      ) : (
        <div className="specialization-tree-grid">
          {profession.trees.map(
            (tree) => (
              <SpecializationTreeCard
                key={
                  tree.id
                }
                onRankChange={
                  onRankChange
                }
                ranks={
                  ranks
                }
                tree={
                  tree
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}
