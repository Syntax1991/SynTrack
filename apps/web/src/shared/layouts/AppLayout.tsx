import { Outlet } from "react-router-dom";
import { AppNavigation } from "../components/AppNavigation";
import { RequireRaiderSession } from "../components/RequireRaiderSession";

export function AppLayout() {
  return (
    <RequireRaiderSession>
      <div className="app-shell">
        <AppNavigation />

        <main className="main-content">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>
    </RequireRaiderSession>
  );
}
