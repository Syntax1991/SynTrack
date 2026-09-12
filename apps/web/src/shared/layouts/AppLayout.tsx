import { Outlet } from "react-router-dom";
import { AppNavigation } from "../components/AppNavigation";
import { RequireRaiderSession } from "../components/RequireRaiderSession";
import { WowMediaIconsProvider } from "../wow-media/WowMediaIconsProvider";

export function AppLayout() {
  return (
    <RequireRaiderSession>
      <WowMediaIconsProvider>
        <div className="app-shell">
          <AppNavigation />

          <main className="main-content">
            <div className="content-container">
              <Outlet />
            </div>
          </main>
        </div>
      </WowMediaIconsProvider>
    </RequireRaiderSession>
  );
}
