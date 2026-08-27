import { LoadingPanel } from "../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../apps/web/src/shared/components/StatusMessage";
import { ProfessionOverviewRow } from "../details/components/ProfessionOverviewRow";
import { useProfessionOverview } from "../details/hooks/useProfessionOverview";
import { groupProfessionOverviewByCategory } from "../details/utils/professionOverviewPresentation";
import { ProfessionsTabNav } from "../shared/components/ProfessionsTabNav";

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

  const craftingItems =
    items.filter(
      (item) =>
        item.category ===
        "CRAFTING"
    );

  const coveredCraftingCount =
    craftingItems.filter(
      (item) =>
        item.characterCount > 0 &&
        item.captureStatus ===
          "CAPTURED"
    ).length;

  return (
    <>
      <ProfessionsTabNav />

      <PageHeader
        description={`${coveredCraftingCount}/${craftingItems.length} crafting professions covered · Open a row for crafters, recipes and exact responsibility.`}
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
        <section className="profession-overview-panel">
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
      )}
    </>
  );
}
