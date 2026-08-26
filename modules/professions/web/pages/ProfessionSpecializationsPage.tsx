import {
  useSearchParams
} from "react-router-dom";
import {
  LoadingPanel
} from "../../../../apps/web/src/shared/components/LoadingPanel";
import {
  PageHeader
} from "../../../../apps/web/src/shared/components/PageHeader";
import {
  StatusMessage
} from "../../../../apps/web/src/shared/components/StatusMessage";
import {
  useProfessionCharacters
} from "../shared/hooks/useProfessionCharacters";
import {
  CharacterProfessionSpecializations
} from "../specializations/components/CharacterProfessionSpecializations";
import {
  useCharacterSpecializations
} from "../specializations/hooks/useCharacterSpecializations";
import {
  ProfessionsTabNav
} from "../shared/components/ProfessionsTabNav";

export function ProfessionSpecializationsPage() {
  const {
    characters,
    isLoading: charactersLoading,
    error: charactersError
  } = useProfessionCharacters();

  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();

  const requestedCharacterId =
    searchParams.get("character");

  const defaultCharacter = [
    ...characters
  ].sort(
    (left, right) =>
      getTotalKnowledge(right) -
      getTotalKnowledge(left)
  )[0];

  const selectedCharacter =
    characters.find(
      (character) =>
        character.id ===
        requestedCharacterId
    ) ?? defaultCharacter ?? null;

  const {
    overview,
    ranks,
    isLoading,
    savingProfessionId,
    error,
    setNodeRank,
    saveProfession
  } = useCharacterSpecializations(
    selectedCharacter?.id
  );

  function selectCharacter(
    characterId: string
  ) {
    const next =
      new URLSearchParams(
        searchParams
      );

    next.set(
      "character",
      characterId
    );

    setSearchParams(
      next,
      { replace: true }
    );
  }

  const totalKnowledge =
    selectedCharacter
      ? getTotalKnowledge(
          selectedCharacter
        )
      : 0;

  return (
    <>
      <ProfessionsTabNav />

      <PageHeader
        description="Review and maintain the captured profession trees for every guild crafter."
        eyebrow="PROFESSION PROGRESSION"
        title="Specializations"
      />

      {(charactersError || error) && (
        <StatusMessage type="error">
          {charactersError ??
            error ??
            "Specializations could not be loaded."}
        </StatusMessage>
      )}

      {charactersLoading ? (
        <LoadingPanel />
      ) : selectedCharacter ? (
        <>
          <section className="panel profession-character-scope">
            <label className="profession-module-select">
              <span>Character</span>
              <select
                onChange={
                  (event) =>
                    selectCharacter(
                      event.target.value
                    )
                }
                value={selectedCharacter.id}
              >
                {characters.map(
                  (character) => (
                    <option
                      key={character.id}
                      value={character.id}
                    >
                      {character.name}
                      {" · "}
                      {character.realm}
                    </option>
                  )
                )}
              </select>
            </label>

            <span className="profession-module-avatar large">
              {selectedCharacter.name
                .slice(0, 2)
                .toUpperCase()}
            </span>

            <div className="profession-character-scope-copy">
              <strong>
                {selectedCharacter.name}
              </strong>
              <span>
                {selectedCharacter.className}
                {" · Level "}
                {selectedCharacter.level}
                {" · "}
                {selectedCharacter.realm}
              </span>
            </div>

            <dl className="profession-module-scope-stats compact">
              <div>
                <dt>Professions</dt>
                <dd>
                  {selectedCharacter.professions.length}
                </dd>
              </div>
              <div>
                <dt>Knowledge</dt>
                <dd>{totalKnowledge}</dd>
              </div>
            </dl>
          </section>

          {isLoading ? (
            <LoadingPanel />
          ) : overview ? (
            <div className="profession-specialization-workspace">
              {overview.professions.map(
                (profession) => (
                  <CharacterProfessionSpecializations
                    isSaving={
                      savingProfessionId ===
                      profession.id
                    }
                    key={profession.id}
                    onRankChange={
                      setNodeRank
                    }
                    onSave={() => {
                      void saveProfession(
                        profession.id
                      );
                    }}
                    profession={profession}
                    ranks={ranks}
                  />
                )
              )}
            </div>
          ) : null}
        </>
      ) : (
        <section className="panel">
          <div className="empty-state">
            No characters with professions are available.
          </div>
        </section>
      )}
    </>
  );
}

function getTotalKnowledge(
  character: {
    professions: Array<{
      knowledgePoints: number;
    }>;
  }
) {
  return character.professions.reduce(
    (total, profession) =>
      total + profession.knowledgePoints,
    0
  );
}
