import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { AddonFilePanel } from "../../integrations/components/AddonFilePanel";
import { AddonImportResultPanel } from "../../integrations/components/AddonImportResultPanel";
import { AddonPreviewPanel } from "../../integrations/components/AddonPreviewPanel";
import { useAddonImport } from "../../integrations/hooks/useAddonImport";

export function ManualSavedVariablesImportPanel() {
  const addonImport =
    useAddonImport();

  return (
    <div className="settings-manual-import">
      {addonImport.error && (
        <StatusMessage type="error">
          {addonImport.error}
        </StatusMessage>
      )}

      {addonImport.result && (
        <StatusMessage type="info">
          Manual import completed successfully.
        </StatusMessage>
      )}

      <p className="muted-text">
        Use this only when automatic desktop sync is unavailable.
        Select SynTrack_Core.lua or SynTrack_Professions.lua from your
        WoW SavedVariables folder. Legacy ProfessionTracker.lua is still
        accepted as a fallback.
      </p>

      <AddonFilePanel
        fileName={
          addonImport.fileName
        }
        fileSize={
          addonImport.fileSize
        }
        hasPreview={
          addonImport.preview !==
          null
        }
        hasSource={
          addonImport.hasSource
        }
        isImporting={
          addonImport.isImporting
        }
        isPreviewing={
          addonImport.isPreviewing
        }
        onFileSelected={
          addonImport.selectFile
        }
        onImport={
          addonImport.importSnapshot
        }
        onPreview={
          addonImport.previewSnapshot
        }
      />

      {addonImport.preview && (
        <AddonPreviewPanel
          preview={
            addonImport.preview
          }
        />
      )}

      {addonImport.result && (
        <AddonImportResultPanel
          result={
            addonImport.result
          }
        />
      )}
    </div>
  );
}
