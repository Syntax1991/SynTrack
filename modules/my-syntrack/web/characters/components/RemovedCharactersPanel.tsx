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

export function RemovedCharactersPanel({
  items,
  isLoading,
  restoringId,
  onRestore
}: RemovedCharactersPanelProps) {
  return (
    <section className="panel matrix-panel removed-characters-panel">
      <div className="matrix-toolbar">
        <span className="eyebrow">REMOVED CHARACTERS</span>
      </div>

      {isLoading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted">No removed characters.</p>
      ) : (
        <table className="dense-matrix">
          <thead>
            <tr>
              <th>Character</th>
              <th>Realm</th>
              <th>Removed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.characterName}</td>
                <td>{item.realmName}</td>
                <td>{formatRemovedDate(item.removedAt)}</td>
                <td>
                  <button
                    className="button button-secondary button-compact"
                    disabled={restoringId === item.id}
                    onClick={() => onRestore(item.id)}
                    type="button"
                  >
                    {restoringId === item.id ? "Restoring…" : "Restore"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
