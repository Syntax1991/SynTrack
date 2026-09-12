import { getClientDownloadFileUrl } from "../api/clientDownloadApi";
import { useClientDownloadInfo } from "../hooks/useClientDownloadInfo";

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

export function ClientDownloadCard() {
  const state = useClientDownloadInfo();

  return (
    <div className="landing-download-card">
      <h3>SynTrack Desktop Client</h3>

      <p>
        Windows companion app that watches your WoW SavedVariables and
        syncs them to your account automatically — no manual addon
        export needed.
      </p>

      {state.status === "loading" && (
        <span className="landing-download-status">
          Checking for the latest version…
        </span>
      )}

      {(state.status === "error" ||
        (state.status === "ready" &&
          !state.info.available)) && (
        <span className="landing-download-status">
          No build is available for download right now — please check
          back soon.
        </span>
      )}

      {state.status === "ready" && state.info.available && (
        <>
          <a
            className="button button-primary"
            href={getClientDownloadFileUrl()}
          >
            Download for Windows
            {state.info.version
              ? ` (v${state.info.version})`
              : ""}
          </a>

          <span className="landing-download-meta">
            {formatFileSize(state.info.sizeBytes)} · Windows 10/11 ·
            64-bit
          </span>
        </>
      )}
    </div>
  );
}
