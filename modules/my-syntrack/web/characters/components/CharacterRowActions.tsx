import {
  useEffect,
  useRef,
  useState
} from "react";

type CharacterRowActionsProps = {
  characterName: string;
  onEdit: () => void;
  onDelete: () => void;
  onManageTags: () => void;
};

/*
 * Edit/Delete are occasional administration, not the primary roster
 * action (Specializations is) - collapsing them behind a compact
 * overflow menu keeps every row from repeating three text actions.
 */
export function CharacterRowActions({
  characterName,
  onEdit,
  onDelete,
  onManageTags
}: CharacterRowActionsProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, [isOpen]);

  return (
    <div
      className="matrix-row-menu"
      ref={containerRef}
    >
      <button
        aria-expanded={isOpen}
        aria-label={`More actions for ${characterName}`}
        className="matrix-row-menu-trigger"
        onClick={() =>
          setIsOpen((open) => !open)
        }
        type="button"
      >
        ⋯
      </button>

      {isOpen && (
        <div
          className="matrix-row-menu-list"
          role="menu"
        >
          <button
            onClick={() => {
              setIsOpen(false);
              onManageTags();
            }}
            role="menuitem"
            type="button"
          >
            Tags
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
            role="menuitem"
            type="button"
          >
            Edit
          </button>

          <button
            className="danger"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            role="menuitem"
            type="button"
          >
            Remove from SynTrack
          </button>
        </div>
      )}
    </div>
  );
}
