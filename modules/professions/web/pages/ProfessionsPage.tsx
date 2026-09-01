import { LoadingPanel } from "../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../apps/web/src/shared/components/StatusMessage";
import { ProfessionOverviewRow } from "../details/components/ProfessionOverviewRow";
import { useProfessionOverview } from "../details/hooks/useProfessionOverview";
import { groupProfessionOverviewByCategory } from "../details/utils/professionOverviewPresentation";
import { ProfessionWorkMatrix } from "../overview-work/components/ProfessionWorkMatrix";
import { ProfessionWorkSummary } from "../overview-work/components/ProfessionWorkSummary";
import { useProfessionOverviewWork } from "../overview-work/hooks/useProfessionOverviewWork";
import { ProfessionsTabNav } from "../shared/components/ProfessionsTabNav";

export function ProfessionsPage() {
  const {
    items,
    isLoading: craftLoading,
    error: craftError
  } = useProfessionOverview();

  const {
    summary,
    rows,
    isLoading: workLoading,
    error: workError
  } = useProfessionOverviewWork();

  const categoryGroups =
    groupProfessionOverviewByCategory(
      items
    );

  const craftingItems =
    items.filter(
      (item) =>
        item.category ===
        "CRAFTING"
    );

  const coveredCraftingCount =
    summary?.craftingCoverage.covered ??
    craftingItems.filter(
      (item) =>
        item.characterCount > 0 &&
        item.captureStatus ===
          "CAPTURED"
    ).length;

  const totalCraftingCount =
    summary?.craftingCoverage.total ??
    craftingItems.length;

  const isLoading = craftLoading || workLoading;
  const error = craftError ?? workError;

  return (
    <>
      <ProfessionsTabNav />

      <PageHeader
        description="Scan open profession work across your roster, then drill into craft coverage and responsibility."
        eyebrow="PROFESSION CONTROL CENTER"
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
        <>
          {summary && (
            <ProfessionWorkSummary
              summary={summary}
            />
          )}

          <section className="profession-work-panel">
            <div className="profession-section-heading">
              <h2>Profession work</h2>
              <p>
                One row per character and profession. Weekly Quest,
                Treatise, and Drops come from automatic profession
                snapshots.
              </p>
            </div>

            <ProfessionWorkMatrix rows={rows} />
          </section>

          <section className="profession-overview-panel">
            <div className="profession-section-heading">
              <h2>Crafting coverage</h2>
              <p>
                {coveredCraftingCount}/{totalCraftingCount} crafting
                professions covered · Open a row for crafters, recipes
                and exact responsibility.
              </p>
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

                        <span>
                          {categoryGroup.items.length}
                        </span>
                      </p>

                      <div className="profession-overview-header">
                        <span>Profession</span>
                        <span>Crafters</span>
                        <span>Specialized</span>
                        <span>Status</span>
                        <span aria-hidden="true" />
                      </div>

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
        </>
      )}
    </>
  );
}
