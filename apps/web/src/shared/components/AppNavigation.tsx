import {
  useEffect,
  useState
} from "react";
import {
  NavLink,
  useLocation
} from "react-router-dom";
import {
  mainModules
} from "../../app/modules/mainModules";
import type {
  MainModuleDefinition
} from "../../app/modules/mainModules";
import { RaiderAuthTopAction } from "../../../../../modules/data-platform/web/raider-auth/components/RaiderAuthTopAction";
import { isModuleCurrent } from "./appNavigation.helpers";
import { SidebarModuleGroup } from "./SidebarModuleGroup";

type ModuleId =
  MainModuleDefinition["id"];

export function AppNavigation() {
  const { pathname } =
    useLocation();

  const currentModule =
    mainModules.find(
      (module) =>
        module.status === "active" &&
        isModuleCurrent(
          module,
          pathname
        )
    ) ?? mainModules[0];

  const [
    expandedModuleIds,
    setExpandedModuleIds
  ] = useState<Set<ModuleId>>(
    () =>
      new Set<ModuleId>([
        currentModule.id
      ])
  );

  const [
    mobileOpen,
    setMobileOpen
  ] = useState(false);

  useEffect(
    () => {
      setExpandedModuleIds(
        (previous) => {
          if (
            previous.has(
              currentModule.id
            )
          ) {
            return previous;
          }

          const next =
            new Set(previous);

          next.add(
            currentModule.id
          );

          return next;
        }
      );

      setMobileOpen(false);
    },
    [
      currentModule.id,
      pathname
    ]
  );

  useEffect(
    () => {
      function closeOnEscape(
        event: KeyboardEvent
      ) {
        if (event.key === "Escape") {
          setMobileOpen(false);
        }
      }

      document.addEventListener(
        "keydown",
        closeOnEscape
      );

      return () => {
        document.removeEventListener(
          "keydown",
          closeOnEscape
        );
      };
    },
    []
  );

  const activeModules =
    mainModules.filter(
      (module) =>
        module.status === "active"
    );

  const plannedModules =
    mainModules.filter(
      (module) =>
        module.status === "planned"
    );

  function toggleModule(
    moduleId: ModuleId
  ) {
    setExpandedModuleIds(
      (previous) => {
        const next =
          new Set(previous);

        if (next.has(moduleId)) {
          next.delete(moduleId);
        }
        else {
          next.add(moduleId);
        }

        return next;
      }
    );
  }

  function renderModuleGroup(
    module: MainModuleDefinition
  ) {
    return (
      <SidebarModuleGroup
        current={
          currentModule.id ===
          module.id
        }
        expanded={
          expandedModuleIds.has(
            module.id
          )
        }
        key={module.id}
        module={module}
        onNavigate={() =>
          setMobileOpen(false)
        }
        onToggle={() =>
          toggleModule(module.id)
        }
      />
    );
  }

  return (
    <>
      <header className="mobile-topbar">
        <button
          aria-controls="app-sidebar"
          aria-expanded={mobileOpen}
          aria-label="Open navigation"
          className="mobile-menu-button"
          onClick={() =>
            setMobileOpen(true)
          }
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <NavLink
          className="mobile-brand"
          to="/"
        >
          <span className="brand-mark">
            ST
          </span>

          <strong>SynTrack</strong>
        </NavLink>

        <RaiderAuthTopAction />
      </header>

      <button
        aria-label="Close navigation"
        className={
          mobileOpen
            ? "sidebar-backdrop visible"
            : "sidebar-backdrop"
        }
        onClick={() =>
          setMobileOpen(false)
        }
        type="button"
      />

      <aside
        aria-label="SynTrack navigation"
        className={
          mobileOpen
            ? "app-sidebar mobile-open"
            : "app-sidebar"
        }
        id="app-sidebar"
      >
        <div className="sidebar-header">
          <NavLink
            aria-label="SynTrack home"
            className="sidebar-brand"
            onClick={() =>
              setMobileOpen(false)
            }
            to="/"
          >
            <span className="brand-mark">
              ST
            </span>

            <span className="sidebar-brand-copy">
              <strong>SynTrack</strong>
              <small>Personal Control Center</small>
            </span>
          </NavLink>

          <div className="sidebar-header-actions">
            <RaiderAuthTopAction />

            <button
              aria-label="Close navigation"
              className="sidebar-close-button"
              onClick={() =>
                setMobileOpen(false)
              }
              type="button"
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        <nav className="sidebar-navigation">
          <section className="sidebar-section">
            <div className="sidebar-section-heading">
              <span>Workspace</span>
              <small>
                {activeModules.length} live
              </small>
            </div>

            <div className="sidebar-module-list">
              {activeModules.map(
                renderModuleGroup
              )}
            </div>
          </section>

          <section className="sidebar-section">
            <div className="sidebar-section-heading">
              <span>Roadmap</span>
              <small>
                {plannedModules.length} planned
              </small>
            </div>

            <div className="sidebar-module-list">
              {plannedModules.map(
                renderModuleGroup
              )}
            </div>
          </section>
        </nav>

        <footer className="app-sidebar-footer">
          <span className="online-dot" />

          <span>
            <strong>Platform online</strong>
            <small>Foundation build</small>
          </span>
        </footer>
      </aside>
    </>
  );
}
