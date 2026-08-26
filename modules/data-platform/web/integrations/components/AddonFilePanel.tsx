import type {
  ChangeEvent
} from "react";

type AddonFilePanelProps = {
  fileName: string | null;
  fileSize: number | null;
  hasSource: boolean;
  hasPreview: boolean;
  isPreviewing: boolean;
  isImporting: boolean;
  onFileSelected: (
    file: File | null
  ) => Promise<void>;
  onPreview: () => Promise<void>;
  onImport: () => Promise<void>;
};

function formatFileSize(
  bytes: number
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(
    kilobytes / 1024
  ).toFixed(1)} MB`;
}

export function AddonFilePanel({
  fileName,
  fileSize,
  hasSource,
  hasPreview,
  isPreviewing,
  isImporting,
  onFileSelected,
  onPreview,
  onImport
}: AddonFilePanelProps) {
  const handleFileChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ??
      null;

    event.target.value = "";

    void onFileSelected(
      file
    );
  };

  return (
    <section className="panel addon-import-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            SAVEDVARIABLES
          </p>

          <h2>
            SynTrack_Professions.lua
          </h2>
        </div>

        <span className="integration-badge configured">
          Schema 4–10
        </span>
      </div>

      <div className="instruction-box">
        <strong>
          Where is the file?
        </strong>

        <p>
          Open your WoW folder and select
          the file under WTF → Account →
          your account → SavedVariables →
          SynTrack_Professions.lua. Legacy
          ProfessionTracker.lua exports are
          also supported.
        </p>
      </div>

      <div className="addon-file-picker">
        <label
          className="button button-secondary"
          htmlFor="addon-savedvariables-file"
        >
          Select file
        </label>

        <input
          accept=".lua,text/plain"
          id="addon-savedvariables-file"
          onChange={handleFileChange}
          type="file"
        />

        <div className="addon-file-details">
          {fileName ? (
            <>
              <strong>
                {fileName}
              </strong>

              <span>
                {fileSize === null
                  ? "File loaded"
                  : formatFileSize(
                      fileSize
                    )}
              </span>
            </>
          ) : (
            <span>
              No SavedVariables file selected yet.
            </span>
          )}
        </div>
      </div>

      <div className="integration-actions">
        <button
          className="button button-secondary"
          disabled={
            !hasSource ||
            isPreviewing ||
            isImporting
          }
          onClick={() => {
            void onPreview();
          }}
          type="button"
        >
          {isPreviewing
            ? "Reviewing…"
            : "Review snapshot"}
        </button>

        <button
          className="button button-primary"
          disabled={
            !hasPreview ||
            isPreviewing ||
            isImporting
          }
          onClick={() => {
            void onImport();
          }}
          type="button"
        >
          {isImporting
            ? "Importing…"
            : "Import data"}
        </button>
      </div>
    </section>
  );
}