import type { MainModuleDefinition } from "../moduleTypes";

export const mySynTrackModule: MainModuleDefinition =
  {
    id: "my-syntrack",
    label: "My SynTrack",
    description:
      "Your characters and personal progress.",
    status: "active",
    items: [
      {
        label: "Overview",
        path: "/",
        status: "available",
        end: true
      },
      {
        label: "My Characters",
        path: "/characters",
        status: "available"
      },
      {
        label: "Weekly Checklist",
        path: "/weekly-checklist",
        status: "available"
      },
      {
        label: "Vault / M+",
        path: "/vault-mythic-plus",
        status: "available"
      },
      {
        label: "Professions",
        status: "available",
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
      },
      {
        label: "Gear",
        path: "/gear-readiness",
        status: "available"
      },
      {
        label: "Settings",
        path: "/settings",
        status: "available"
      }
    ]
  };