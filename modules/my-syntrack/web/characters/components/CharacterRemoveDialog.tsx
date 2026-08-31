type CharacterRemoveDialogProps = {
  characterName: string;
  realmName: string;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CharacterRemoveDialog({
  characterName,
  realmName,
  isRemoving,
  onCancel,
  onConfirm
}: CharacterRemoveDialogProps) {
  return (
    <div className="guild-modal-backdrop" role="presentation">
      <div
        aria-labelledby="character-remove-title"
        aria-modal="true"
        className="guild-editor-modal"
        role="dialog"
      >
        <div className="guild-editor-modal-header">
          <div>
            <h2 id="character-remove-title">
              Remove {characterName} - {realmName} from SynTrack?
            </h2>
            <p>
              This removes its tracked SynTrack data and prevents automatic WoW
              sync from adding it again.
            </p>
            <p>You can restore the character later.</p>
          </div>
          <button
            aria-label="Close"
            className="guild-editor-modal-close"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="guild-editor-modal-body character-remove-actions">
          <button
            className="button button-secondary"
            disabled={isRemoving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="button button-danger"
            disabled={isRemoving}
            onClick={onConfirm}
            type="button"
          >
            {isRemoving ? "Removing…" : "Remove character"}
          </button>
        </div>
      </div>
    </div>
  );
}
