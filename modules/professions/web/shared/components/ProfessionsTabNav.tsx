import { RouteTabs } from "../../../../../apps/web/src/shared/components/RouteTabs";

/*
 * Page-level navigation for the Professions domain. The global sidebar
 * only shows one "Professions" entry (see navDomains.ts) - Overview /
 * Find Craft / Specializations are separate existing routes/pages, and
 * this is what lets a user move between them without those three
 * cluttering global navigation.
 */
export function ProfessionsTabNav() {
  return (
    <RouteTabs
      ariaLabel="Professions sections"
      tabs={[
        {
          label: "Overview",
          path: "/professions",
          end: true
        },
        {
          label: "Find Craft",
          path: "/professions/crafters"
        },
        {
          label: "Specializations",
          path: "/professions/specializations"
        }
      ]}
    />
  );
}
