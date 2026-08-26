import { RouteTabs } from "../../../../../apps/web/src/shared/components/RouteTabs";

/*
 * Page-level navigation for the Weeklies domain. The global sidebar
 * only shows one "Weeklies" entry (see navDomains.ts) pointing at the
 * existing Weekly Checklist route - this is what lets a user reach the
 * existing Vault/M+ page without it cluttering global navigation.
 * "Tasks" is intentionally absent: there is no real generic weekly task
 * implementation yet, and this must not invent fake content.
 */
export function WeekliesTabNav() {
  return (
    <RouteTabs
      ariaLabel="Weeklies sections"
      tabs={[
        {
          label: "Overview",
          path: "/weekly-checklist",
          end: true
        },
        {
          label: "Vault / M+",
          path: "/vault-mythic-plus"
        }
      ]}
    />
  );
}
