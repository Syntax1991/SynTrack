import { Drawer } from "../../../../../apps/web/src/shared/components/Drawer";
import type { TagView } from "../../tags/types/tag.types";

type CharacterTagsPopoverProps = {
  characterName: string;
  tags: TagView[];
  assignedTagIds: Set<string>;
  onClose: () => void;
  onToggle: (
    tagId: string,
    isAssigned: boolean
  ) => void;
};

/*
 * Assign/unassign only - creating/renaming/deleting tags themselves
 * happens in Settings, not here, so this stays a compact checklist
 * rather than a second tag-management surface.
 */
export function CharacterTagsPopover({
  characterName,
  tags,
  assignedTagIds,
  onClose,
  onToggle
}: CharacterTagsPopoverProps) {
  return (
    <Drawer
      onClose={onClose}
      title={`Tags · ${characterName}`}
    >
      {tags.length === 0 ? (
        <p className="muted-text character-tags-popover-empty">
          No tags yet. Create one in
          Settings first.
        </p>
      ) : (
        <ul className="character-tags-popover-list">
          {tags.map((tag) => {
            const isAssigned =
              assignedTagIds.has(
                tag.id
              );

            return (
              <li key={tag.id}>
                <label>
                  <input
                    checked={
                      isAssigned
                    }
                    onChange={() =>
                      onToggle(
                        tag.id,
                        isAssigned
                      )
                    }
                    type="checkbox"
                  />

                  {tag.name}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}
