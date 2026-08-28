import { Drawer } from "../../../../../apps/web/src/shared/components/Drawer";
import { IndeterminateCheckbox } from "../../../../../apps/web/src/shared/components/IndeterminateCheckbox";
import type { TagView } from "../../tags/types/tag.types";
import { computeBulkTagState } from "../utils/characterTagSelection";

type BulkTagsPopoverProps = {
  selectedCount: number;
  tags: TagView[];
  selectedCharacterIds: Set<string>;
  tagIdsByCharacterId: Map<string, Set<string>>;
  onClose: () => void;
  onAddToAll: (tagId: string) => void;
  onRemoveFromAll: (tagId: string) => void;
};

/*
 * NONE/ALL toggle with a single click (unambiguous). SOME never
 * resolves itself on click - the checkbox renders indeterminate and
 * disabled, and both explicit actions are shown side by side instead,
 * per the "do not silently guess" requirement.
 */
export function BulkTagsPopover({
  selectedCount,
  tags,
  selectedCharacterIds,
  tagIdsByCharacterId,
  onClose,
  onAddToAll,
  onRemoveFromAll
}: BulkTagsPopoverProps) {
  return (
    <Drawer
      onClose={onClose}
      title={`Tags · ${selectedCount} selected`}
    >
      {tags.length === 0 ? (
        <p className="muted-text character-tags-popover-empty">
          No tags yet. Create one in
          Settings first.
        </p>
      ) : (
        <ul className="character-tags-popover-list">
          {tags.map((tag) => {
            const state = computeBulkTagState(
              tag.id,
              selectedCharacterIds,
              tagIdsByCharacterId
            );

            return (
              <li
                className="bulk-tag-row"
                key={tag.id}
              >
                <label>
                  <IndeterminateCheckbox
                    aria-label={tag.name}
                    checked={
                      state === "ALL"
                    }
                    disabled={
                      state === "SOME"
                    }
                    indeterminate={
                      state === "SOME"
                    }
                    onChange={() => {
                      if (
                        state === "NONE"
                      ) {
                        onAddToAll(
                          tag.id
                        );
                      }
                      else if (
                        state === "ALL"
                      ) {
                        onRemoveFromAll(
                          tag.id
                        );
                      }
                    }}
                  />

                  {tag.name}
                </label>

                {state === "SOME" && (
                  <span className="bulk-tag-actions">
                    <button
                      className="text-button"
                      onClick={() =>
                        onAddToAll(
                          tag.id
                        )
                      }
                      type="button"
                    >
                      Add to all
                    </button>

                    <button
                      className="text-button"
                      onClick={() =>
                        onRemoveFromAll(
                          tag.id
                        )
                      }
                      type="button"
                    >
                      Remove from all
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}
