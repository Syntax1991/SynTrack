import { Link, useParams } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { CharacterAttentionSection } from "../components/CharacterAttentionSection";
import { CharacterDataHealthSection } from "../components/CharacterDataHealthSection";
import { CharacterDetailHeader } from "../components/CharacterDetailHeader";
import { CharacterProfessionsSection } from "../components/CharacterProfessionsSection";
import { CharacterProfessionKnowledgeTreasureSection } from "../components/CharacterProfessionKnowledgeTreasureSection";
import { CharacterProfessionWeeklySection } from "../components/CharacterProfessionWeeklySection";
import { CharacterResourcesSection } from "../components/CharacterResourcesSection";
import { CharacterStatusStrip } from "../components/CharacterStatusStrip";
import { CharacterThisWeekSection } from "../components/CharacterThisWeekSection";
import { CharacterTierEmbellishmentSection } from "../components/CharacterTierEmbellishmentSection";
import { CharacterTrackersSection } from "../components/CharacterTrackersSection";
import { useCharacterControlDetail } from "../hooks/useCharacterControlDetail";

/*
 * The middle layer between the account-wide Overview matrix and each
 * domain workspace - a single concise hub, not another dashboard with
 * Overview/Gear/Weeklies/Vault/Professions tabs recreating the whole
 * app under every character. Every fact here is read from
 * OverviewService.getCharacterState via one bounded request; nothing
 * is recomputed.
 */
export function CharacterDetailPage() {
  const { characterId } = useParams<{
    characterId: string;
  }>();

  const {
    detail,
    isLoading,
    error,
    notFound
  } =
    useCharacterControlDetail(
      characterId
    );

  if (!characterId) {
    return (
      <>
        <PageHeader
          eyebrow="CHARACTER"
          title="Character"
        />

        <StatusMessage type="error">
          The character ID is missing.
        </StatusMessage>
      </>
    );
  }

  if (notFound) {
    return (
      <section className="panel character-detail-not-found">
        <p className="eyebrow">
          NOT FOUND
        </p>

        <h2>Character not found</h2>

        <p>
          This character may have been
          removed, or the link is no
          longer valid.
        </p>

        <Link
          className="button button-primary"
          to="/characters"
        >
          Back to characters
        </Link>
      </section>
    );
  }

  if (isLoading || !detail) {
    return (
      <>
        <PageHeader
          eyebrow="CHARACTER"
          title="Character"
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
      <CharacterDetailHeader
        character={
          detail.character.character
        }
        tags={detail.character.tags}
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      <CharacterStatusStrip
        character={detail.character}
      />

      <CharacterAttentionSection
        character={detail.character}
      />

      <CharacterDataHealthSection
        health={
          detail.character.health
        }
      />

      <CharacterThisWeekSection
        character={detail.character}
        period={detail.period}
      />

      <CharacterProfessionsSection
        characterId={characterId}
        professions={
          detail.character.professions
        }
      />

      <CharacterResourcesSection
        resources={
          detail.character.resources
        }
      />

      <CharacterTierEmbellishmentSection
        tier={detail.character.tier}
        embellishments={
          detail.character.embellishments
        }
      />

      <CharacterProfessionWeeklySection
        professionWeekly={
          detail.character
            .professionWeekly
        }
      />

      <CharacterProfessionKnowledgeTreasureSection
        professionKnowledgeTreasures={
          detail.character
            .professionKnowledgeTreasures
        }
      />

      {detail.trackerColumns.length >
        0 && (
        <CharacterTrackersSection
          character={detail.character}
          trackerColumns={
            detail.trackerColumns
          }
        />
      )}
    </>
  );
}
