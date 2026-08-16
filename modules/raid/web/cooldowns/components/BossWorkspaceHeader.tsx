import { useState } from "react";
import { formatRelativeTime } from "../utils/timelineFormat";

type BossWorkspaceView = "timeline" | "list";

type BossWorkspaceHeaderProps = {
  bossName: string;
  view: BossWorkspaceView;
  onViewChange: (
    view: BossWorkspaceView
  ) => void;
  wclSyncedAt: string | null;
  isSyncing: boolean;
  onSync: () => void;
  isPhaseFormOpen: boolean;
  onTogglePhaseForm: () => void;
};

/**
 * One compact workspace header replacing what used to be spread
 * across three components (boss title + sync pill + help in
 * BossCooldownTimeline's own toolbar, the Timeline/List toggle in
 * BossCooldownView, a separate "+Phase" actions row). Manual phase-
 * marker entry lives behind the overflow menu, not as a peer control
 * next to the primary workspace actions — automatic/real phase data
 * from RaidBossPhaseMarker sync is the normal path, this is the
 * fallback for when it isn't available yet.
 */
export function BossWorkspaceHeader({
  bossName,
  view,
  onViewChange,
  wclSyncedAt,
  isSyncing,
  onSync,
  isPhaseFormOpen,
  onTogglePhaseForm
}: BossWorkspaceHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  return (
    <div className="cooldown-workspace-header">
      <h2>{bossName}</h2>

      <div className="cooldown-workspace-header-row">
        <div className="cooldown-view-toggle">
          <button
            className={
              view === "timeline"
                ? "button button-secondary active"
                : "button button-secondary"
            }
            onClick={() =>
              onViewChange("timeline")
            }
            type="button"
          >
            Timeline
          </button>

          <button
            className={
              view === "list"
                ? "button button-secondary active"
                : "button button-secondary"
            }
            onClick={() =>
              onViewChange("list")
            }
            type="button"
          >
            List
          </button>
        </div>

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
