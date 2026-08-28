type BulkTagActionBarProps = {
  selectedCount: number;
  onOpenTags: () => void;
  onClear: () => void;
};

/*
 * Only rendered while at least one character is selected - stays out
 * of the way of the dense roster layout otherwise (see
 * CharactersPage.tsx).
 */
export function BulkTagActionBar({
  selectedCount,
  onOpenTags,
  onClear
}: BulkTagActionBarProps) {
  return (
    <div className="bulk-action-bar">
      <span className="bulk-action-count">
        {selectedCount} selected
      </span>

      <button
        className="button"
        onClick={onOpenTags}
        type="button"
      >
        Tags
      </button>

      <button
        className="text-button"
        onClick={onClear}
        type="button"
      >
        Clear
      </button>
    </div>
  );
}
