import type {
  MainModuleDefinition
} from "../../app/modules/mainModules";

const moduleIconPaths:
  Record<
    MainModuleDefinition["id"],
    string[]
  > = {
    "my-syntrack": [
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      "M4 21a8 8 0 0 1 16 0"
    ],
    guild: [
      "M12 3 4 7v5c0 4.8 3.2 7.7 8 9 4.8-1.3 8-4.2 8-9V7l-8-4Z",
      "m9 12 2 2 4-4"
    ],
    loot: [
      "M6 4h12l3 6-9 11L3 10 6 4Z",
      "M3 10h18",
      "m8 4-2 6m7-6 2 6"
    ],
    professions: [
      "m14 5 5 5",
      "m16 3 5 5-3 3-5-5 3-3Z",
      "M13 8 4 4L7 22H3v-4L13 8Z"
    ],
    recruitment: [
      "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      "M2 21a7 7 0 0 1 14 0",
      "M19 8v6m-3-3h6"
    ],
    automation: [
      "m13 2-9 12h7l-1 8 9-12h-7l1-8Z"
    ]
  };

export function ModuleIcon({
  moduleId
}: {
  moduleId: MainModuleDefinition["id"];
}) {
  return (
    <svg
      aria-hidden="true"
      className="module-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      {moduleIconPaths[moduleId].map(
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
