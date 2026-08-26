import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";
import { GuildDashboardPage } from "../../../../modules/guild/web/dashboard/pages/GuildDashboardPage";
import { OfficerNotesPage } from "../../../../modules/guild/web/officer-notes/pages/OfficerNotesPage";
import { SettingsPage } from "../../../../modules/guild/web/raider-link/pages/SettingsPage";
import { RequirementsPage } from "../../../../modules/guild/web/requirements/pages/RequirementsPage";
import { RosterPage } from "../../../../modules/guild/web/roster/pages/RosterPage";
import { GuildSettingsPage } from "../../../../modules/guild/web/settings/pages/GuildSettingsPage";
import { TeamsPage } from "../../../../modules/guild/web/teams/pages/TeamsPage";
import { WeeklyProgressPage } from "../../../../modules/guild/web/weekly-progress/pages/WeeklyProgressPage";
import { CharactersPage } from "../../../../modules/my-syntrack/web/characters/pages/CharactersPage";
import { OverviewPage } from "../../../../modules/my-syntrack/web/overview/pages/OverviewPage";
import { GearReadinessPage } from "../../../../modules/my-syntrack/web/gear-readiness/pages/GearReadinessPage";
import { RaidTasksPage } from "../../../../modules/my-syntrack/web/raid-tasks/pages/RaidTasksPage";
import { WeeklyChecklistPage } from "../../../../modules/my-syntrack/web/weekly-checklist/pages/WeeklyChecklistPage";
import { VaultMythicPlusPage } from "../../../../modules/my-syntrack/web/vault-mythic-plus/pages/VaultMythicPlusPage";
import { RaiderLoginCallbackPage } from "../../../../modules/data-platform/web/raider-auth/pages/RaiderLoginCallbackPage";
import { LootTablePage } from "../../../../modules/loot/web/catalog/pages/LootTablePage";
import { WishlistPage } from "../../../../modules/loot/web/wishlist/pages/WishlistPage";
import { DroptimizerPage } from "../../../../modules/loot/web/droptimizer/pages/DroptimizerPage";
import { ProfessionDetailPage } from "../../../../modules/professions/web/details/pages/ProfessionDetailPage";
import { ProfessionFindCraftPage } from "../../../../modules/professions/web/pages/ProfessionFindCraftPage";
import { ProfessionKnowledgePage } from "../../../../modules/professions/web/pages/ProfessionKnowledgePage";
import { ProfessionRecipeWorkspacePage } from "../../../../modules/professions/web/pages/ProfessionRecipeWorkspacePage";
import { ProfessionSpecializationsPage } from "../../../../modules/professions/web/pages/ProfessionSpecializationsPage";
import { ProfessionsPage } from "../../../../modules/professions/web/pages/ProfessionsPage";
import { CharacterSpecializationsPage } from "../../../../modules/professions/web/specializations/pages/CharacterSpecializationsPage";
import { AppLayout } from "../shared/layouts/AppLayout";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={<OverviewPage />}
        />

        <Route
          path="characters"
          element={<CharactersPage />}
        />

        <Route
          path="characters/:characterId"
          element={
            <CharacterSpecializationsPage />
          }
        />

        <Route
          path="characters/:characterId/specializations"
          element={
            <CharacterSpecializationsPage />
          }
        />

        <Route
          path="settings"
          element={<SettingsPage />}
        />

        <Route
          path="raider-link"
          element={
            <Navigate
              replace
              to="/settings"
            />
          }
        />

        <Route
          path="weekly-checklist"
          element={<WeeklyChecklistPage />}
        />

        <Route
          path="vault-mythic-plus"
          element={<VaultMythicPlusPage />}
        />

        <Route
          path="raid-tasks"
          element={<RaidTasksPage />}
        />

        <Route
          path="gear-readiness"
          element={<GearReadinessPage />}
        />

        <Route
          path="professions"
          element={<ProfessionsPage />}
        />

        <Route
          path="professions/crafters"
          element={<ProfessionFindCraftPage />}
        />

        <Route
          path="professions/recipes"
          element={
            <ProfessionRecipeWorkspacePage mode="catalog" />
          }
        />

        <Route
          path="professions/knowledge"
          element={<ProfessionKnowledgePage />}
        />

        <Route
          path="professions/specializations"
          element={<ProfessionSpecializationsPage />}
        />

        <Route
          path="professions/material-quality"
          element={
            <ProfessionRecipeWorkspacePage mode="material-quality" />
          }
        />

        <Route
          path="professions/concentration"
          element={
            <ProfessionRecipeWorkspacePage mode="concentration" />
          }
        />

        <Route
          path="professions/recommendations"
          element={
            <ProfessionRecipeWorkspacePage mode="recommendations" />
          }
        />

        <Route
          path="professions/:professionId"
          element={<ProfessionDetailPage />}
        />

        <Route
          path="guild"
          element={<GuildDashboardPage />}
        />

        <Route
          path="guild/roster"
          element={<RosterPage />}
        />

        <Route
          path="guild/audit"
          element={
            <Navigate
              replace
              to="/guild/roster"
            />
          }
        />

        <Route
          path="guild/teams"
          element={<TeamsPage />}
        />

        <Route
          path="guild/weekly-progress"
          element={<WeeklyProgressPage />}
        />

        <Route
          path="guild/requirements"
          element={<RequirementsPage />}
        />

        <Route
          path="guild/officer-notes"
          element={<OfficerNotesPage />}
        />

        <Route
          path="guild/settings"
          element={<GuildSettingsPage />}
        />

        <Route
          path="guild/raider-link"
          element={
            <Navigate
              replace
              to="/settings"
            />
          }
        />

        <Route
          path="loot"
          element={<LootTablePage />}
        />

        <Route
          path="loot/wishlist"
          element={<WishlistPage />}
        />

        <Route
          path="loot/droptimizer"
          element={<DroptimizerPage />}
        />

        <Route
          path="addon"
          element={
            <Navigate
              replace
              to="/settings"
            />
          }
        />

        <Route
          path="battlenet"
          element={
            <Navigate
              replace
              to="/settings"
            />
          }
        />
      </Route>

      <Route
        element={<RaiderLoginCallbackPage />}
        path="raider-login"
      />

      <Route
        path="*"
        element={
          <Navigate
            replace
            to="/"
          />
        }
      />
    </Routes>
  );
}