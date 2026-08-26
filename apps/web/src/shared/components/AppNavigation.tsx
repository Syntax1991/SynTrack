import {
  useEffect,
  useState
} from "react";
import {
  Link,
  useLocation
} from "react-router-dom";
import {
  primaryNavDomains,
  settingsNavDomain
} from "../../app/modules/navDomains";
import type {
  NavDomain
} from "../../app/modules/navDomains";
import { RaiderAuthTopAction } from "../../../../../modules/data-platform/web/raider-auth/components/RaiderAuthTopAction";
import { NavIcon } from "./NavIcon";

export function AppNavigation() {
  const { pathname } =
    useLocation();

  const [
    mobileOpen,
    setMobileOpen
  ] = useState(false);

  useEffect(
    () => {
      setMobileOpen(false);
    },
    [pathname]
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

  function renderNavItem(
    domain: NavDomain
  ) {
    const active =
      domain.isActive(pathname);

    return (
      <Link
        className={
          active
            ? "sidebar-nav-item active"
            : "sidebar-nav-item"
        }
        key={domain.id}
        onClick={() =>
          setMobileOpen(false)
        }
        to={domain.path}
      >
        <span className="sidebar-nav-icon">
          <NavIcon
            domainId={domain.id}
          />
        </span>

        <span className="sidebar-nav-label">
          {domain.label}
        </span>
      </Link>
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

        <Link
          className="mobile-brand"
          to="/"
        >
          <span className="brand-mark">
            ST
          </span>

          <strong>SynTrack</strong>
        </Link>

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
          <Link
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
          </Link>

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
          <div className="sidebar-nav-list">
            {primaryNavDomains.map(
              renderNavItem
            )}
          </div>

          <div className="sidebar-nav-divider" />

          <div className="sidebar-nav-list">
            {renderNavItem(
              settingsNavDomain
            )}
          </div>
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
