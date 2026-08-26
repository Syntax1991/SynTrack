import {
  LoadingPanel
} from "../../../../apps/web/src/shared/components/LoadingPanel";
import {
  StatusMessage
} from "../../../../apps/web/src/shared/components/StatusMessage";
import {
  ProfessionFindCraftWorkspace
} from "../details/components/ProfessionFindCraftWorkspace";
import {
  useProfessionDetail
} from "../details/hooks/useProfessionDetail";
import {
  ProfessionModuleWorkspace
} from "../shared/components/ProfessionModuleWorkspace";

function FindCraftContent({
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

  return (
    <ProfessionFindCraftWorkspace
      detail={detail}
      professionId={professionId}
    />
  );
}

export function ProfessionFindCraftPage() {
  return (
    <ProfessionModuleWorkspace
      description="I want to craft X - who should do it? Search a recipe and compare crafters."
      eyebrow="FIND CRAFT"
      title="Find Craft"
    >
      {(profession) => (
        <FindCraftContent
          key={profession.id}
          professionId={
            profession.id
          }
        />
      )}
    </ProfessionModuleWorkspace>
  );
}
