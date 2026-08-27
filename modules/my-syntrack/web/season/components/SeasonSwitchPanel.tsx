import { useState } from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { useTrackerScopeProfiles } from "../hooks/useTrackerScopeProfiles";

/*
 * A small, deliberate control - switching the active tracker season is
 * explicit and lives only here, not scattered as a giant selector
 * across every page. Historical profiles stay listed (never deleted)
 * since switching season must not lose access to old scopes.
 */
export function SeasonSwitchPanel() {
  const {
    profiles,
    isLoading,
    error,
    create,
    activate
  } = useTrackerScopeProfiles();

  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] =
    useState(false);

  async function handleCreate(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      key.trim().length === 0 ||
      name.trim().length === 0
    ) {
      return;
    }

    setIsSaving(true);

    try {
      await create({ key, name });
      setKey("");
      setName("");
    }
    finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel character-tags-manager">
      <h2>Tracker Season</h2>

      <p className="character-tags-manager-hint">
        Season trackers pinned on
        Overview/Character Detail come
        from whichever season is active
        here, plus any GLOBAL tracker.
        Switching season never deletes
        or alters past values.
      </p>

      {error && (
        <p className="character-tags-manager-error">
          {error}
        </p>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : (
        <ul className="character-tags-manager-list">
          {profiles.map((profile) => (
            <li key={profile.id}>
              <span>
                {profile.name}
                {" ("}
                {profile.key}
                {")"}
              </span>

              {profile.isActive ? (
                <span className="matrix-token matrix-token-ready">
                  Active
                </span>
              ) : (
                <button
                  className="text-button"
                  onClick={() => {
                    void activate(
                      profile.key
                    );
                  }}
                  type="button"
                >
                  Set active
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="character-tags-manager-form"
        onSubmit={(event) => {
          void handleCreate(event);
        }}
      >
        <input
          aria-label="New season key"
          onChange={(event) =>
            setKey(event.target.value)
          }
          placeholder="Key (e.g. MIDNIGHT-S2)"
          type="text"
          value={key}
        />

        <input
          aria-label="New season name"
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          placeholder="Name (e.g. Midnight Season 2)"
          type="text"
          value={name}
        />

        <button
          disabled={isSaving}
          type="submit"
        >
          Add season
        </button>
      </form>
    </section>
  );
}
