import {
  Link
} from "react-router-dom";
import {
  LoadingPanel
} from "../../../../apps/web/src/shared/components/LoadingPanel";
import {
  StatusMessage
} from "../../../../apps/web/src/shared/components/StatusMessage";
import {
  useProfessionDetail
} from "../details/hooks/useProfessionDetail";
import {
  ProfessionModuleWorkspace
} from "../shared/components/ProfessionModuleWorkspace";

function KnowledgeContent({
  professionId
}: {
  professionId: string;
}) {
  const {
    detail,
    isLoading,
    error
  } = useProfessionDetail(
    professionId
  );

  if (error) {
    return (
      <StatusMessage type="error">
        {error}
      </StatusMessage>
    );
  }

  if (isLoading || !detail) {
    return <LoadingPanel />;
  }

  const characters = [
    ...detail.characters
  ].sort(
    (left, right) =>
      right.knowledgePoints -
        left.knowledgePoints ||
      right.skill - left.skill
  );

  const totalKnowledge =
    characters.reduce(
      (total, character) =>
        total +
        character.knowledgePoints,
      0
    );

  const averageSkill =
    characters.length > 0
      ? Math.round(
          characters.reduce(
            (total, character) =>
              total + character.skill,
            0
          ) / characters.length
        )
      : 0;

  const highestKnowledge =
    Math.max(
      1,
      ...characters.map(
        (character) =>
          character.knowledgePoints
      )
    );

  return (
    <section className="profession-knowledge-workspace">
      <div className="profession-module-summary-grid">
        <article className="panel">
          <span>Total knowledge</span>
          <strong>{totalKnowledge}</strong>
          <small>across all crafters</small>
        </article>

        <article className="panel">
          <span>Average skill</span>
          <strong>{averageSkill}</strong>
          <small>base profession skill</small>
        </article>

        <article className="panel">
          <span>Captured</span>
          <strong>
            {
              characters.filter(
                (character) =>
                  character.dataStatus ===
                  "TRACKED"
              ).length
            }
            {"/"}
            {characters.length}
          </strong>
          <small>complete character data</small>
        </article>
      </div>

      <section className="panel profession-knowledge-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">
              KNOWLEDGE COVERAGE
            </p>
            <h2>Crafter Progress</h2>
          </div>

          <span className="profession-module-result-count">
            {characters.length} crafters
          </span>
        </header>

        {characters.length === 0 ? (
          <div className="empty-state">
            No characters are assigned to this profession.
          </div>
        ) : (
          <div className="profession-knowledge-list">
            {characters.map(
              (character) => (
                <article
                  className="profession-knowledge-row"
                  key={character.characterProfessionId}
                >
                  <span className="profession-module-avatar">
                    {character.character.name
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>

                  <div className="profession-knowledge-identity">
                    <strong>
                      {character.character.name}
                    </strong>
                    <span>
                      {character.character.className}
                      {" · "}
                      {character.character.realm}
                    </span>
                  </div>

                  <div className="profession-knowledge-progress">
                    <span>
                      <strong>
                        {character.knowledgePoints}
                      </strong>
                      {" knowledge"}
                    </span>
                    <span>
                      <i
                        style={{
                          width: `${Math.round(
                            character.knowledgePoints /
                              highestKnowledge *
                              100
                          )}%`
                        }}
                      />
                    </span>
                  </div>

                  <dl className="profession-knowledge-stats">
                    <div>
                      <dt>Skill</dt>
                      <dd>{character.skill}</dd>
                    </div>
                    <div>
                      <dt>Recipes</dt>
                      <dd>
                        {character.recipes.length}
                      </dd>
                    </div>
                    <div>
                      <dt>Capabilities</dt>
                      <dd>
                        {character.capabilities.length}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    className="profession-module-row-link"
                    to={`/professions/specializations?profession=${professionId}&character=${character.character.id}`}
                  >
                    Open tree
                  </Link>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </section>
  );
}

export function ProfessionKnowledgePage() {
  return (
    <ProfessionModuleWorkspace
      description="Compare profession skill, knowledge investment and captured coverage across every crafter."
      eyebrow="PROGRESSION"
      title="Knowledge"
    >
      {(profession) => (
        <KnowledgeContent
          key={profession.id}
          professionId={
            profession.id
          }
        />
      )}
    </ProfessionModuleWorkspace>
  );
}
