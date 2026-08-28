import { useState } from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useProfessions } from "../../../../professions/web/hooks/useProfessions";
import { useTags } from "../../tags/hooks/useTags";
import { BulkTagActionBar } from "../components/BulkTagActionBar";
import { BulkTagsPopover } from "../components/BulkTagsPopover";
import { CharacterDrawer } from "../components/CharacterDrawer";
import { CharacterRosterToolbar } from "../components/CharacterRosterToolbar";
import { CharacterTable } from "../components/CharacterTable";
import { CharacterTagsPopover } from "../components/CharacterTagsPopover";
import { useCharacterFilters } from "../hooks/useCharacterFilters";
import { useCharacterSelection } from "../hooks/useCharacterSelection";
import { useCharacters } from "../hooks/useCharacters";
import type {
  Character,
  CharacterInput
} from "../types/character.types";

const minimumCraftingLevel = 80;

/*
 * The roster is the primary workflow here - adding a character is
 * occasional administration, so it lives behind a deliberate "Add
 * character" action (a drawer) instead of a permanent half-page form.
 */
export function CharactersPage() {
  const [isAddOpen, setIsAddOpen] =
    useState(false);

  const [
    editingCharacter,
    setEditingCharacter
  ] = useState<Character | null>(null);

  const [
    tagManagementCharacter,
    setTagManagementCharacter
  ] = useState<Character | null>(null);

  const [
    isBulkTagsOpen,
    setIsBulkTagsOpen
  ] = useState(false);

  const {
    characters,
    isLoading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter
  } = useCharacters();

  const {
    professions,
    isLoading: professionsLoading,
    error: professionsError
  } = useProfessions();

  const {
    tags,
    tagIdsByCharacterId,
    assign: assignTag,
    unassign: unassignTag,
    bulkAssign
  } = useTags();

  const {
    searchTerm,
    setSearchTerm,
    classFilter,
    setClassFilter,
    professionFilter,
    setProfessionFilter,
    tagFilter,
    setTagFilter,
    classOptions,
    professionOptions,
    visibleCharacters
  } = useCharacterFilters(
    characters,
    tagIdsByCharacterId
  );

  const {
    selectedCharacterIds,
    toggleSelectCharacter,
    toggleSelectAllVisible,
    clearSelection,
    removeFromSelection
  } = useCharacterSelection(
    visibleCharacters
  );

  const isDrawerOpen =
    isAddOpen || editingCharacter !== null;

  function closeDrawer() {
    setIsAddOpen(false);
    setEditingCharacter(null);
  }

  const handleSubmit = async (
    input: CharacterInput
  ) => {
    if (editingCharacter) {
      await updateCharacter(
        editingCharacter.id,
        input
      );
    }
    else {
      await createCharacter(input);
    }

    closeDrawer();
  };

  const handleDelete = async (
    character: Character
  ) => {
    const confirmed = window.confirm(
      `${character.name} delete?`
    );

    if (!confirmed) {
      return;
    }

    await deleteCharacter(character.id);
    removeFromSelection(character.id);
  };

  return (
    <>
      <PageHeader
        actions={
          <button
            className="button button-primary"
            onClick={() =>
              setIsAddOpen(true)
            }
            type="button"
          >
            Add character
          </button>
        }
        description="Manage your crafters and their two primary professions."
        eyebrow="CRAFTER ROSTER"
        title="Characters"
      />

      {(error || professionsError) && (
        <StatusMessage type="error">
          {error ??
            professionsError ??
            "Unknown error"}
        </StatusMessage>
      )}

      <section className="panel matrix-panel">
        <CharacterRosterToolbar
          classFilter={classFilter}
          classOptions={classOptions}
          onClassFilterChange={
            setClassFilter
          }
          onProfessionFilterChange={
            setProfessionFilter
          }
          onSearchTermChange={
            setSearchTerm
          }
          professionFilter={
            professionFilter
          }
          professionOptions={
            professionOptions
          }
          searchTerm={searchTerm}
          summaryText={`${characters.length} characters`}
          onTagFilterChange={
            setTagFilter
          }
          tagFilter={tagFilter}
          tagOptions={tags}
        />

        {selectedCharacterIds.size >
          0 && (
          <BulkTagActionBar
            onClear={clearSelection}
            onOpenTags={() =>
              setIsBulkTagsOpen(true)
            }
            selectedCount={
              selectedCharacterIds.size
            }
          />
        )}

        {isLoading ? (
          <LoadingPanel />
        ) : (
          <CharacterTable
            characters={
              visibleCharacters
            }
            minimumCraftingLevel={
              minimumCraftingLevel
            }
            onDelete={(character) => {
              void handleDelete(
                character
              );
            }}
            onEdit={setEditingCharacter}
            onManageTags={
              setTagManagementCharacter
            }
            onToggleSelect={
              toggleSelectCharacter
            }
            onToggleSelectAllVisible={
              toggleSelectAllVisible
            }
            selectedCharacterIds={
              selectedCharacterIds
            }
            tagIdsByCharacterId={
              tagIdsByCharacterId
            }
            tags={tags}
          />
        )}
      </section>

      {isDrawerOpen && (
        <CharacterDrawer
          character={editingCharacter}
          onClose={closeDrawer}
          onSubmit={handleSubmit}
          professions={professions}
          professionsLoading={
            professionsLoading
          }
        />
      )}

      {tagManagementCharacter && (
        <CharacterTagsPopover
          assignedTagIds={
            tagIdsByCharacterId.get(
              tagManagementCharacter.id
            ) ?? new Set()
          }
          characterName={
            tagManagementCharacter.name
          }
          onClose={() =>
            setTagManagementCharacter(
              null
            )
          }
          onToggle={(
            tagId,
            isAssigned
          ) => {
            const characterId =
              tagManagementCharacter.id;

            void (isAssigned
              ? unassignTag(
                  tagId,
                  characterId
                )
              : assignTag(
                  tagId,
                  characterId
                ));
          }}
          tags={tags}
        />
      )}

      {isBulkTagsOpen && (
        <BulkTagsPopover
          onAddToAll={(tagId) => {
            void bulkAssign({
              characterIds: [
                ...selectedCharacterIds
              ],
              addTagIds: [tagId],
              removeTagIds: []
            });
          }}
          onClose={() =>
            setIsBulkTagsOpen(false)
          }
          onRemoveFromAll={(tagId) => {
            void bulkAssign({
              characterIds: [
                ...selectedCharacterIds
              ],
              addTagIds: [],
              removeTagIds: [tagId]
            });
          }}
          selectedCharacterIds={
            selectedCharacterIds
          }
          selectedCount={
            selectedCharacterIds.size
          }
          tagIdsByCharacterId={
            tagIdsByCharacterId
          }
          tags={tags}
        />
      )}
    </>
  );
}
