import type { NavDomainId } from "../../app/modules/navDomains";

const navIconPaths: Record<
  NavDomainId,
  string[]
> = {
  overview: [
    "M4 13h6V4H4v9Z",
    "M14 20h6v-9h-6v9Z",
    "M14 4v4h6V4h-6Z",
    "M4 20h6v-4H4v4Z"
  ],
  season: [
    "M12 3v3",
    "M12 18v3",
    "M3 12h3",
    "M18 12h3",
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
  ],
  characters: [
    "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M2 21a7 7 0 0 1 14 0",
    "M16 3.5a4 4 0 0 1 0 7.6",
    "M20 21a7 7 0 0 0-4.5-6.5"
  ],
  weeklies: [
    "M4 5h16v15H4V5Z",
    "M4 9.5h16",
    "M8 3v3.5",
    "M16 3v3.5"
  ],
  professions: [
    "m14 5 5 5",
    "m16 3 5 5-3 3-5-5 3-3Z",
    "M13 8 4 4L7 22H3v-4L13 8Z"
  ],
  settings: [
    "M4 6h10",
    "M18 6h2",
    "M4 12h4",
    "M12 12h8",
    "M4 18h13",
    "M21 18h-1",
    "M14 4v4",
    "M8 10v4",
    "M18 16v4"
  ]
};

export function NavIcon({
  domainId
}: {
  domainId: NavDomainId;
}) {
  return (
    <svg
      aria-hidden="true"
      className="nav-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      {navIconPaths[domainId].map(
        (path) => (
          <path
            d={path}
            key={path}
          />
        )
      )}
    </svg>
  );
}
