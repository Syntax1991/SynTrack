import { RouteTabs } from "../../../../../apps/web/src/shared/components/RouteTabs";

/*
 * Page-level navigation for the Season domain (one "Season" sidebar
 * entry, see navDomains.ts): the seasonal goal checklist and the Bonus
 * Roll planner.
 */
export function SeasonTabNav() {
  return (
    <RouteTabs
      ariaLabel="Season sections"
      tabs={[
        { label: "Goals", path: "/season", end: true },
        { label: "Bonus Rolls", path: "/season/bonus-rolls" }
      ]}
    />
  );
}
