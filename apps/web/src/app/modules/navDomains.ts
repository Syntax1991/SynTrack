export type NavDomainId =
  | "overview"
  | "season"
  | "characters"
  | "weeklies"
  | "professions"
  | "settings";

export type NavDomain = {
  id: NavDomainId;
  label: string;
  path: string;
  /*
   * Domain-membership check for sidebar highlighting - a domain can own
   * more than one existing route (e.g. Weeklies covers both
   * /weekly-checklist and /vault-mythic-plus), so this is a predicate
   * rather than a single path prefix.
   */
  isActive: (pathname: string) => boolean;
};

/*
 * The sidebar represents PRODUCT DOMAINS, not every page. Sub-pages
 * (Vault / M+ inside Weeklies; Find Craft and Specializations inside
 * Professions) live as page-level tabs within their domain - see
 * WeekliesTabNav and ProfessionsTabNav - rather than as permanent
 * sidebar entries. Guild/Loot/Recruitment/Raid Tasks/Automation are not
 * part of the active personal product surface (their backend/routes
 * remain for a later deliberate cleanup).
 *
 * Gear is intentionally absent from primary navigation: Seasonal Tier /
 * Embellishment setup live on /season; detailed gear remains Character
 * Detail + legacy /gear-readiness route for existing drilldowns.
 */
export const primaryNavDomains: NavDomain[] = [
  {
    id: "overview",
    label: "Overview",
    path: "/",
    isActive: (pathname) =>
      pathname === "/"
  },
  {
    id: "season",
    label: "Season",
    path: "/season",
    isActive: (pathname) =>
      pathname === "/season" ||
      pathname.startsWith("/season/")
  },
  {
    id: "characters",
    label: "Characters",
    path: "/characters",
    isActive: (pathname) =>
      pathname === "/characters" ||
      pathname.startsWith(
        "/characters/"
      )
  },
  {
    id: "weeklies",
    label: "Weeklies",
    path: "/weekly-checklist",
    isActive: (pathname) =>
      pathname ===
        "/weekly-checklist" ||
      pathname ===
        "/vault-mythic-plus"
  },
  {
    id: "professions",
    label: "Professions",
    path: "/professions",
    isActive: (pathname) =>
      pathname === "/professions" ||
      pathname.startsWith(
        "/professions/"
      )
  }
];

export const settingsNavDomain: NavDomain =
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    isActive: (pathname) =>
      pathname === "/settings"
  };

/** Legacy account-wide Gear page — not a primary product domain. */
export const LEGACY_GEAR_ROUTE_PATH = "/gear-readiness";
