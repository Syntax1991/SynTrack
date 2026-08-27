import { useSearchParams } from "react-router-dom";
import { LoadingPanel } from "../../../../apps/web/src/shared/components/LoadingPanel";
import { StatusMessage } from "../../../../apps/web/src/shared/components/StatusMessage";
import { ProfessionSpecializationsWorkspace } from "../details/components/ProfessionSpecializationsWorkspace";
import { useProfessionDetail } from "../details/hooks/useProfessionDetail";
import { ProfessionModuleWorkspace } from "../shared/components/ProfessionModuleWorkspace";
import { ProfessionsTabNav } from "../shared/components/ProfessionsTabNav";

function SpecializationsContent({
  professionId,
  characterId
}: {
  professionId: string;
  characterId: string | null;
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

  return (
    <ProfessionSpecializationsWorkspace
      detail={detail}
      initialCharacterId={
        characterId
      }
    />
  );
}

/*
 * Profession-first responsibility workspace. Manual mutation remains
 * on /characters/:characterId/specializations; this global page is the
 * read-only place to answer who covers a responsibility, which exact
 * ID-mapped node proves it, and which real rank is invested.
 */
export function ProfessionSpecializationsPage() {
  const [searchParams] =
    useSearchParams();

  const requestedCharacterId =
    searchParams.get("character");

  return (
    <>
      <ProfessionsTabNav />

      <ProfessionModuleWorkspace
        description="Who is responsible for what? Compare exact verified nodes and ranks across every crafter."
        eyebrow="RESPONSIBILITY"
        title="Specializations"
      >
        {(profession) => (
          <SpecializationsContent
            characterId={
              requestedCharacterId
            }
            key={`${profession.id}:${requestedCharacterId ?? "default"}`}
            professionId={
              profession.id
            }
          />
        )}
      </ProfessionModuleWorkspace>
    </>
  );
}
