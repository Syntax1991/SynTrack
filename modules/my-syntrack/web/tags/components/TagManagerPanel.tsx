import { useState } from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { useTags } from "../hooks/useTags";

/*
 * Tag CRUD only - assigning/unassigning a tag to a specific character
 * happens on the Characters roster, not here, so this stays a small
 * management surface rather than a second admin product.
 */
export function TagManagerPanel() {
  const {
    tags,
    isLoading,
    error,
    create,
    update,
    remove
  } = useTags();

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] =
    useState(false);

  const [
    renamingTagId,
    setRenamingTagId
  ] = useState<string | null>(null);

  const [renameValue, setRenameValue] =
    useState("");

  async function handleCreate(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (name.trim().length === 0) {
      return;
    }

    setIsSaving(true);

    try {
      await create({ name });
      setName("");
    }
    finally {
      setIsSaving(false);
    }
  }

  async function handleRename(
    tagId: string
  ) {
    if (
      renameValue.trim().length === 0
    ) {
      return;
    }

    await update(tagId, {
      name: renameValue
    });

    setRenamingTagId(null);
  }

  return (
    <section className="panel character-tags-manager">
      <h2>Character Tags</h2>

      <p className="character-tags-manager-hint">
        Personal organization for your
        roster (Raid, M+, Alt, ...).
        Assign tags to characters from
        the Characters page.
      </p>

      <form
        className="character-tags-manager-form"
        onSubmit={(event) => {
          void handleCreate(event);
        }}
      >
        <input
          aria-label="New tag name"
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          placeholder="New tag (e.g. Raid)"
          type="text"
          value={name}
        />

        <button
          disabled={isSaving}
          type="submit"
        >
          Add
        </button>
      </form>

      {error && (
        <p className="character-tags-manager-error">
          {error}
        </p>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : tags.length === 0 ? (
        <p className="muted-text">
          No tags yet.
        </p>
      ) : (
        <ul className="character-tags-manager-list">
          {tags.map((tag) => (
            <li key={tag.id}>
              {renamingTagId ===
              tag.id ? (
                <>
                  <input
                    aria-label={`Rename ${tag.name}`}
                    onChange={(
                      event
                    ) =>
                      setRenameValue(
                        event.target
                          .value
                      )
                    }
                    value={
                      renameValue
                    }
                  />

                  <button
                    onClick={() => {
                      void handleRename(
                        tag.id
                      );
                    }}
                    type="button"
                  >
                    Save
                  </button>

                  <button
                    onClick={() =>
                      setRenamingTagId(
                        null
                      )
                    }
                    type="button"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span>
                    {tag.name}
                  </span>

                  <button
                    className="text-button"
                    onClick={() => {
                      setRenamingTagId(
                        tag.id
                      );
                      setRenameValue(
                        tag.name
                      );
                    }}
                    type="button"
                  >
                    Rename
                  </button>

                  <button
                    className="text-button danger"
                    onClick={() => {
                      void remove(
                        tag.id
                      );
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
