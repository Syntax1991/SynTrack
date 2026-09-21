import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

/*
 * Standalone layout for public legal pages (Impressum, Datenschutz) -
 * deliberately rendered OUTSIDE AppLayout/RequireRaiderSession, since
 * these must be readable without signing in and without the
 * authenticated app shell/sidebar.
 */
export function LegalPageLayout({
  title,
  lastUpdated,
  children
}: LegalPageLayoutProps) {
  return (
    <div className="legal-page">
      <div className="legal-page-content">
        <Link className="legal-page-back" to="/">
          ← SynTrack
        </Link>

        <h1>{title}</h1>

        <p className="legal-page-updated">
          Stand: {lastUpdated}
        </p>

        <div className="legal-page-body">
          {children}
        </div>
      </div>
    </div>
  );
}
