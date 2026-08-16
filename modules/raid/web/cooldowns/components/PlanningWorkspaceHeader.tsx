import { useState } from "react";
import type { RaidBoss } from "../../boss-rosters/types/bossRoster.types";
import { formatRelativeTime } from "../utils/timelineFormat";

type PlanningWorkspaceView = "timeline" | "list";

type PlanningWorkspaceHeaderProps = {
  bossName: string;
  bosses: RaidBoss[];
  selectedBossId: string;
  onSelectBoss: (bossId: string) => void;
  onBackToEvents: () => void;
  view: PlanningWorkspaceView;
  onViewChange: (view: PlanningWorkspaceView) => void;
  wclSyncedAt: string | null;
  isSyncing: boolean;
  onSync: () => void;
  isPhaseFormOpen: boolean;
  onTogglePhaseForm: () => void;
};

const viewModes: Array<{
  id: PlanningWorkspaceView;
  label: string;
}> = [
  { id: "timeline", label: "Timeline" },
  { id: "list", label: "List" }
];

/**
 * Consolidates what used to be five separate page-level rows (the
 * page title/description, a standalone "Back to events" button, a
 * full-width boss tab strip, a duplicate boss <h2>, and a separate
 * Timeline/List row) into one dense workspace header, so the
 * planning canvas below starts almost immediately instead of after
 * a stack of generic page chrome. `viewModes` is a plain array
 * specifically so a future Grid/Deaths slice only needs new entries
 * here, not another header redesign.
 */
export function PlanningWorkspaceHeader({
  bossName,
  bosses,
  selectedBossId,
  onSelectBoss,
  onBackToEvents,
  view,
  onViewChange,
  wclSyncedAt,
  isSyncing,
  onSync,
  isPhaseFormOpen,
  onTogglePhaseForm
}: PlanningWorkspaceHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  return (
    <div className="planning-workspace-header">
      <div className="planning-workspace-header-row">
        <div className="planning-workspace-identity">
          <button
            className="planning-workspace-back"
            onClick={onBackToEvents}
            type="button"
          >
            ← Raids
          </button>

          <span className="planning-workspace-boss-name">
            {bossName}
          </span>
        </div>

        <div className="cooldown-view-toggle">
          {viewModes.map((mode) => (
            <button
              className={
                view === mode.id
                  ? "button button-secondary active"
                  : "button button-secondary"
              }
              key={mode.id}
              onClick={() =>
                onViewChange(mode.id)
              }
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="planning-workspace-header-row">
        <select
          aria-label="Switch boss"
          className="planning-workspace-boss-select"
          onChange={(event) =>
            onSelectBoss(
              event.target.value
            )
          }
          value={selectedBossId}
        >
          {bosses.map((boss) => (
            <option
              key={boss.id}
              value={boss.id}
            >
              {boss.name}
            </option>
          ))}
        </select>

        <div className="cooldown-workspace-header-status">
          <button
            className={
              isSyncing
                ? "cooldown-sync-pill is-syncing"
                : "cooldown-sync-pill"
            }
            disabled={isSyncing}
            onClick={onSync}
            title={
              wclSyncedAt
                ? `Synced from Warcraft Logs — ${new Date(wclSyncedAt).toLocaleString()}. Click to re-sync.`
                : "Not synced from Warcraft Logs yet. Click to sync."
            }
            type="button"
          >
            {isSyncing
              ? "⟳ Syncing…"
              : wclSyncedAt
                ? `⟳ ${formatRelativeTime(wclSyncedAt)}`
                : "⟳ Not synced"}
          </button>

          <span
            className="cooldown-planning-horizon"
            title="The Cooldown Planner always renders a fixed 0:00–7:00 planning horizon, regardless of how long the synced pull lasted."
          >
            0:00 – 7:00
          </span>

          <div className="cooldown-workspace-overflow">
            <button
              aria-label="More actions"
              className="cooldown-overflow-button"
              onClick={() =>
                setIsMenuOpen(
                  (current) => !current
                )
              }
              type="button"
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div className="cooldown-overflow-menu">
                <p className="cooldown-overflow-help">
                  Boss ability rows are
                  synced from Warcraft
                  Logs — click the sync
                  pill above to refresh.
                  Click a raider&apos;s
                  row to assign their
                  cooldown; drag a
                  placed cooldown to
                  move it.
                </p>

                <button
                  className="text-button"
                  onClick={() => {
                    onTogglePhaseForm();
                    setIsMenuOpen(
                      false
                    );
                  }}
                  type="button"
                >
                  {isPhaseFormOpen
                    ? "Cancel phase marker"
                    : "+ Add phase marker"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
