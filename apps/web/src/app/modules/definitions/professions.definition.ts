import type { MainModuleDefinition } from "../moduleTypes";

export const professionsModule: MainModuleDefinition =
  {
    id: "professions",
    label: "Professions",
    description:
      "Crafting intelligence and crafter coverage.",
    status: "active",
    items: [
      {
        label: "Overview",
        path: "/professions",
        status: "available",
        end: true
      },
      {
        label: "Find Craft",
        path: "/professions/crafters",
        status: "available"
      },
      {
        label: "Specializations",
        path: "/professions/specializations",
        status: "available"
      }
    ]
  };
