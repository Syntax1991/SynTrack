import { Link, Navigate } from "react-router-dom";
import { useRaiderSessionStatus } from "../hooks/useRaiderSessionStatus";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { ClientDownloadCard } from "../../client-download/components/ClientDownloadCard";

const features: Array<{
  title: string;
  description: string;
}> = [
  {
    title: "Characters",
    description:
      "Every character you play, in one roster — gear, item level and readiness at a glance."
  },
  {
    title: "Weeklies & Vault",
    description:
      "See exactly what's left this reset: Weekly Checklist progress and your Great Vault status, per character."
  },
  {
    title: "Professions",
    description:
      "Crafter finder, recipe knowledge and specialization progress across every alt with a profession."
  },
  {
    title: "Loot",
    description:
      "A shared loot table, a personal wishlist, and Droptimizer upgrade tracking — no spreadsheet required."
  }
];

/*
 * The public marketing/explainer entry point: what a signed-out user
 * sees at "/" instead of being dumped straight into the Battle.net OAuth
 * protocol. An already-authenticated visitor is sent straight into the
 * app - Create account / Log in are never shown once signed in. The
 * hero card's markup/copy is deliberately unchanged from the original
 * compact landing page (see PublicLandingPage.test.tsx) - everything
 * below it is new.
 */
export function PublicLandingPage() {
  const status = useRaiderSessionStatus();

  if (status === "checking") {
    return (
      <div className="raider-session-gate">
        <LoadingPanel label="Checking your session…" />
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to="/" />;
  }

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="raider-session-gate-card raider-landing-card">
          <span className="brand-mark">
            ST
          </span>

          <h1>SynTrack</h1>

          <p className="raider-auth-tagline">
            Personal Control Center
          </p>

          <p>
            Track your World of Warcraft characters, weekly progress and
            professions in one place.
          </p>

          <div className="raider-auth-actions">
            <Link
              className="button button-primary"
              to="/register"
            >
              Create account
            </Link>

            <Link
              className="button button-secondary"
              to="/login"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>What SynTrack does</h2>

        <p className="landing-section-intro">
          SynTrack links to your Battle.net account and, optionally, an
          in-game addon and a small Windows companion app — then pulls
          everything into one personal dashboard.
        </p>

        <div className="landing-feature-grid">
          {features.map((feature) => (
            <div
              className="landing-feature-card"
              key={feature.title}
            >
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-download">
        <h2>Get the desktop client</h2>

        <p className="landing-section-intro">
          Optional, Windows only. Keeps your character data synced
          automatically so you don't have to export SavedVariables by
          hand.
        </p>

        <ClientDownloadCard />
      </section>

      <footer className="landing-footer">
        <p className="landing-disclaimer">
          World of Warcraft® and Blizzard Entertainment® are trademarks
          or registered trademarks of Blizzard Entertainment, Inc. in
          the U.S. and/or other countries. SynTrack is an unofficial
          fan project and is not affiliated with, endorsed, sponsored,
          or specifically approved by Blizzard Entertainment.
        </p>

        <nav className="landing-footer-links">
          <Link to="/impressum">Impressum</Link>
          <Link to="/datenschutz">Datenschutz</Link>
        </nav>
      </footer>
    </div>
  );
}
