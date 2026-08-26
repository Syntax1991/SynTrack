import { LoadingPanel } from "../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../apps/web/src/shared/components/StatusMessage";
import { ProfessionOverviewRow } from "../details/components/ProfessionOverviewRow";
import { useProfessionOverview } from "../details/hooks/useProfessionOverview";
import { groupProfessionOverviewByCategory } from "../details/utils/professionOverviewPresentation";

export function ProfessionsPage() {
  const {
    items,
    isLoading,
    error
  } = useProfessionOverview();

  const categoryGroups =
    groupProfessionOverviewByCategory(
      items
    );

  return (
    <>
      <PageHeader
        description="Open a profession to review its crafters, recipes and slot coverage."
        eyebrow="CRAFTING COVERAGE"
        title="Professions"
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : (
        <section className="panel profession-overview-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                MIDNIGHT
              </p>

              <h2>
                Profession Coverage
              </h2>
            </div>

            <span className="profession-overview-total">
              {items.length}
              {" Professions"}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              No professions yet.
            </div>
          ) : (
            <div className="profession-overview-list">
              {categoryGroups.map(
                (categoryGroup) => (
                  <div
                    className="profession-overview-category-group"
                    key={
                      categoryGroup.category
                    }
                  >
                    <p className="profession-overview-category-heading">
                      {
                        categoryGroup.categoryLabel
                      }
                    </p>

                    {categoryGroup.items.map(
                      (profession) => (
                        <ProfessionOverviewRow
                          key={
                            profession.id
                          }
                          profession={
                            profession
                          }
                        />
                      )
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}
