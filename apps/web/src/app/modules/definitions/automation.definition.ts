import type { MainModuleDefinition } from "../moduleTypes";

export const automationModule: MainModuleDefinition =
  {
    id: "automation",
    label: "Automation",
    description:
      "Alerts, reminders and Discord workflows.",
    status: "planned",
    items: [
      {
        label: "Discord Bot",
        status: "planned"
      },
      {
        label: "Reminders",
        status: "planned"
      },
      {
        label: "Missing Weeklies",
        status: "planned"
      },
      {
        label: "Officer Alerts",
        status: "planned"
      }
    ]
  };
