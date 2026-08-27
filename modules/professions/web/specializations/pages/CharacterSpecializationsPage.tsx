import {
  Link,
  useParams
} from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { CharacterProfessionSpecializations } from "../components/CharacterProfessionSpecializations";
import { useCharacterSpecializations } from "../hooks/useCharacterSpecializations";

export function CharacterSpecializationsPage() {
  const {
    characterId
  } = useParams<{
    characterId: string;
  }>();

  const {
    overview,
    ranks,
    isLoading,
    savingProfessionId,
    error,
    setNodeRank,
    saveProfession
  } =
    useCharacterSpecializations(
      characterId
    );

  if (!characterId) {
    return (
      <>
        <PageHeader
          eyebrow="SPECIALIZATIONS"
          title="Profession Specializations"
        />

        <StatusMessage type="error">
          The character ID is missing.
        </StatusMessage>
      </>
    );
  }

  if (
    isLoading ||
    !overview
  ) {
    return (
      <>
        <PageHeader
          eyebrow="SPECIALIZATIONS"
          title="Profession Specializations"
        />

        {error ? (
          <StatusMessage type="error">
            {error}
          </StatusMessage>
        ) : (
          <LoadingPanel />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <Link
            className="button button-secondary"
            to={`/characters/${characterId}`}
          >
            Back to character
          </Link>
        }
        description={
          `${overview.character.className} · ${overview.character.realm} · Level ${overview.character.level}`
        }
        eyebrow="SPECIALIZATIONS"
        title={
          overview.character.name
        }
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {overview.professions.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            This character does not have any primary professions yet.
          </div>
        </section>
      ) : (
        overview.professions.map(
          (profession) => (
            <CharacterProfessionSpecializations
              isSaving={
                savingProfessionId ===
                profession.id
              }
              key={
                profession.id
              }
              onRankChange={
                setNodeRank
              }
              onSave={() => {
                void saveProfession(
                  profession.id
                );
              }}
              profession={
                profession
              }
              ranks={
                ranks
              }
            />
          )
        )
      )}
    </>
  );
}
