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
  gear: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.1 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10.5a1.65 1.65 0 0 0 1-1.51V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10.5a1.65 1.65 0 0 0 1.51 1H19.5a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
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
