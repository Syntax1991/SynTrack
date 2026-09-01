import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/tabs.css";
import "./styles/tooltip.css";
import "./styles/module-navigation.css";
import "./styles/module-navigation-responsive.css";
import "./styles/integration.css";
import "./styles/addon-integration.css";
import "./styles/battlenet-characters.css";
import "./styles/raider-auth.css";
import "./styles/character-detail-summary.css";
import "./styles/character-detail-coverage.css";
import "./styles/my-syntrack-overview.css";
import "./styles/my-syntrack-characters.css";
import "./styles/my-syntrack-tracker-cell.css";
import "./styles/my-syntrack-tracker-manager.css";
import "./styles/dense-matrix.css";
import "./styles/drawer.css";
import "./styles/character-detail.css";
import "./styles/character-tags.css";
import "./styles/weekly-checklist.css";
import "./styles/vault-mythic-plus-runs.css";
import "./styles/raid-tasks.css";
import "./styles/raid-tasks-board.css";
import "./styles/raid-tasks-responsive.css";
import "./styles/gear-readiness.css";
import "./styles/gear-readiness-slots.css";
import "./styles/gear-readiness-responsive.css";
import "./styles/guild.css";
import "./styles/guild-roster-summary.css";
import "./styles/guild-workspace.css";
import "./styles/guild-workspace-sections.css";
import "./styles/guild-modal.css";
import "./styles/profession-overview.css";
import "./styles/profession-module-workspaces.css";
import "./styles/profession-module-workspaces-responsive.css";
import "./styles/profession-character-details.css";
import "./styles/profession-responsibility-overview.css";
import "./styles/profession-detail-tabs.css";
import "./styles/profession-crafter-workspace.css";
import "./styles/profession-crafter-recipes.css";
import "./styles/profession-find-craft.css";
import "./styles/profession-find-craft-browse.css";
import "./styles/profession-icons-tooltip.css";
import "./styles/profession-recipe-finder.css";
import "./styles/profession-recipe-detail.css";
import "./styles/profession-recipe-simulation.css";
import "./styles/profession-recipe-readiness.css";
import "./styles/specializations.css";
import "./styles/forms.css";
import "./styles/tables.css";

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element was not found."
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);