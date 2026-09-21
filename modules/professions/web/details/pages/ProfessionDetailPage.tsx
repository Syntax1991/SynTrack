import {
  Link,
  useParams
} from "react-router-dom";
import {
  LoadingPanel
} from "../../../../../apps/web/src/shared/components/LoadingPanel";
import {
  PageHeader
} from "../../../../../apps/web/src/shared/components/PageHeader";
import {
  WowProfessionIcon
} from "../../../../../apps/web/src/shared/components/WowProfessionIcon";
import {
  StatusMessage
} from "../../../../../apps/web/src/shared/components/StatusMessage";
import {
  ProfessionDetailWorkspace
} from "../components/ProfessionDetailWorkspace";
import {
  useProfessionDetail
} from "../hooks/useProfessionDetail";

function getCategoryLabel(
  category: string
): string {
  return category === "GATHERING"
    ? "Gathering profession"
    : "Crafting profession";
}

export function ProfessionDetailPage() {
  const {
    professionId
  } = useParams<{
    professionId: string;
  }>();

  const {
    detail,
    isLoading,
    error
  } =
    useProfessionDetail(
      professionId
    );

  if (!professionId) {
    return (
      <>
        <PageHeader
          eyebrow="PROFESSION DETAILS"
          title="Profession"
        />

        <StatusMessage type="error">
          The profession ID is missing.
        </StatusMessage>
      </>
    );
  }

  if (
    isLoading ||
    !detail
  ) {
    return (
      <>
        <PageHeader
          eyebrow="PROFESSION DETAILS"
          title="Loading profession"
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
            to="/professions"
          >
            Back to professions
          </Link>
        }
        description={
          `${getCategoryLabel(detail.profession.category)} · Manage crafting data at a glance`
        }
        eyebrow="PROFESSION DETAILS"
        icon={
          <WowProfessionIcon
            name={detail.profession.name}
            professionKey={detail.profession.key}
            size="lg"
          />
        }
        title={
          detail.profession.name
        }
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      <ProfessionDetailWorkspace
        detail={detail}
        professionId={
          professionId
        }
      />
    </>
  );
}