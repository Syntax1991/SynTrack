import type {
  ReactNode
} from "react";
import {
  useSearchParams
} from "react-router-dom";
import {
  LoadingPanel
} from "../../../../../apps/web/src/shared/components/LoadingPanel";
import {
  PageHeader
} from "../../../../../apps/web/src/shared/components/PageHeader";
import {
  StatusMessage
} from "../../../../../apps/web/src/shared/components/StatusMessage";
import {
  useProfessionOverview
} from "../../details/hooks/useProfessionOverview";
import type {
  ProfessionOverviewItem
} from "../../details/types/professionDetail.types";

type ProfessionModuleWorkspaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: (
    profession: ProfessionOverviewItem
  ) => ReactNode;
};

function getCaptureLabel(
  status:
    ProfessionOverviewItem["captureStatus"]
) {
  switch (status) {
    case "CAPTURED":
      return "Data captured";
    case "NOT_REQUIRED":
      return "Capture not required";
    default:
      return "Capture missing";
  }
}

export function ProfessionModuleWorkspace({
  eyebrow,
  title,
  description,
  children
}: ProfessionModuleWorkspaceProps) {
  const {
    items,
    isLoading,
    error
  } = useProfessionOverview();

  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();

  const requestedProfessionId =
    searchParams.get("profession");

  const selectedProfession =
    items.find(
      (item) =>
        item.id ===
        requestedProfessionId
    ) ??
    items.find(
      (item) =>
        item.category === "CRAFTING"
    ) ??
    items[0] ??
    null;

  function selectProfession(
    professionId: string
  ) {
    const next =
      new URLSearchParams(
        searchParams
      );

    next.set(
      "profession",
      professionId
    );

    setSearchParams(
      next,
      { replace: true }
    );
  }

  return (
    <>
      <PageHeader
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : selectedProfession ? (
        <>
          <section className="profession-module-scope">
            <label className="profession-module-select">
              <span>Profession</span>

              <select
                onChange={
                  (event) =>
                    selectProfession(
                      event.target.value
                    )
                }
                value={selectedProfession.id}
              >
                {items.map(
                  (profession) => (
                    <option
                      key={profession.id}
                      value={profession.id}
                    >
                      {profession.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <div className="profession-module-scope-copy">
              <div>
                <strong>
                  {selectedProfession.name}
                </strong>

                <span>
                  {selectedProfession.category ===
                  "GATHERING"
                    ? "Gathering profession"
                    : "Crafting profession"}
                </span>
              </div>

              <span
                className={`profession-module-capture ${selectedProfession.captureStatus.toLowerCase()}`}
              >
                {getCaptureLabel(
                  selectedProfession.captureStatus
                )}
              </span>
            </div>

            <dl className="profession-module-scope-stats">
              <div>
                <dt>Crafters</dt>
                <dd>
                  {selectedProfession.characterCount}
                </dd>
              </div>

              <div>
                <dt>Recipes</dt>
                <dd>
                  {selectedProfession.catalogRecipeCount}
                </dd>
              </div>

              <div>
                <dt>Capabilities</dt>
                <dd>
                  {selectedProfession.capabilityCount}
                </dd>
              </div>
            </dl>
          </section>

          {children(selectedProfession)}
        </>
      ) : (
        <section className="panel">
          <div className="empty-state">
            No profession data is available yet.
          </div>
        </section>
      )}
    </>
  );
}
