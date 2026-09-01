type RemovedCharacterItem = {
  id: string;
  characterName: string;
  realmName: string;
  removedAt: string;
};

type RemovedCharactersPanelProps = {
  items: RemovedCharacterItem[];
  isLoading: boolean;
  restoringId: string | null;
  onRestore: (removedId: string) => void;
};

function formatRemovedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatSummary(count: number): string {
  return `Removed from SynTrack (${count})`;
}

export function RemovedCharactersPanel({
  items,
  isLoading,
  restoringId,
  onRestore
}: RemovedCharactersPanelProps) {
  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <details className="advanced-disclosure removed-characters-disclosure">
      <summary>{formatSummary(items.length)}</summary>

      <p className="removed-characters-disclosure-hint">
        Sync suppressed until restored
      </p>

      <ul className="removed-characters-list">
        {items.map((item) => (
          <li className="removed-characters-row" key={item.id}>
            <span className="removed-characters-row-main">
              <span className="removed-characters-identity">
                {item.characterName} · {item.realmName}
              </span>
              <span className="removed-characters-date">
                Removed {formatRemovedDate(item.removedAt)}
              </span>
            </span>
            <button
              className="button button-secondary button-compact"
              disabled={restoringId === item.id}
              onClick={() => onRestore(item.id)}
              type="button"
            >
              {restoringId === item.id ? "Restoring…" : "Restore"}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
