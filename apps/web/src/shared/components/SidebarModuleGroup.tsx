import { NavLink } from "react-router-dom";
import type {
  MainModuleDefinition,
  MainModuleItem
} from "../../app/modules/mainModules";
import { ModuleIcon } from "./ModuleIcon";

type SidebarModuleGroupProps = {
  module: MainModuleDefinition;
  current: boolean;
  expanded: boolean;
  onNavigate: () => void;
  onToggle: () => void;
};

/*
 * A nested item (item.items present, e.g. Professions inside My
 * SynTrack) renders as a labeled, always-expanded subgroup rather than
 * its own collapsible module - it is one concept nested one level
 * deeper, not a second sidebar section.
 */
function renderSidebarItem(
  item: MainModuleItem,
  onNavigate: () => void
) {
  if (
    item.items &&
    item.items.length > 0
  ) {
    return (
      <div
        className="sidebar-subgroup"
        key={item.label}
      >
        <span className="sidebar-subgroup-label">
          {item.label}
        </span>

        <div className="sidebar-subgroup-items">
          {item.items.map((child) =>
            renderSidebarItem(
              child,
              onNavigate
            )
          )}
        </div>
      </div>
    );
  }

  if (
    item.status === "available" &&
    item.path
  ) {
    return (
      <NavLink
        className={({
          isActive
        }) =>
          isActive
            ? "sidebar-subitem active"
            : "sidebar-subitem"
        }
        end={
          item.end ?? false
        }
        key={item.label}
        onClick={onNavigate}
        to={item.path}
      >
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <span
      aria-disabled="true"
      className="sidebar-subitem planned"
      key={item.label}
    >
      <span>{item.label}</span>
    </span>
  );
}

export function SidebarModuleGroup({
  module,
  current,
  expanded,
  onNavigate,
  onToggle
}: SidebarModuleGroupProps) {
  const panelId =
    `sidebar-module-${module.id}`;

  return (
    <section
      className={
        current
          ? "sidebar-module-group current"
          : "sidebar-module-group"
      }
    >
      <button
        aria-controls={panelId}
        aria-expanded={expanded}
        className="sidebar-module-toggle"
        onClick={onToggle}
        type="button"
      >
        <span className="sidebar-module-icon">
          <ModuleIcon
            moduleId={module.id}
          />
        </span>

        <span className="sidebar-module-label">
          {module.label}
        </span>

        <span
          aria-hidden="true"
          className="sidebar-module-chevron"
        />
      </button>

      <div
        aria-hidden={!expanded}
        className={
          expanded
            ? "sidebar-module-panel expanded"
            : "sidebar-module-panel"
        }
        id={panelId}
      >
        <div className="sidebar-module-items">
          {module.items.map((item) =>
            renderSidebarItem(
              item,
              onNavigate
            )
          )}
        </div>
      </div>
    </section>
  );
}
