import { NavLink } from "react-router-dom";

export type RouteTabDefinition = {
  label: string;
  path: string;
  end?: boolean;
};

type RouteTabsProps = {
  ariaLabel: string;
  tabs: RouteTabDefinition[];
};

/*
 * Route-driven counterpart to Tabs (which toggles a view within one
 * page). Each tab here is a distinct page/route - used for page-level
 * "what part of this domain am I viewing" navigation (e.g. Professions'
 * Overview / Find Craft / Specializations), reusing the same .app-tabs
 * visual language.
 */
export function RouteTabs({
  ariaLabel,
  tabs
}: RouteTabsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="panel app-tabs"
      role="tablist"
    >
      {tabs.map((tab) => (
        <NavLink
          className={({
            isActive
          }) =>
            isActive
              ? "app-tab active"
              : "app-tab"
          }
          end={tab.end ?? false}
          key={tab.path}
          role="tab"
          to={tab.path}
        >
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
