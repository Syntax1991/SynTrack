import { Drawer } from "../../../../../apps/web/src/shared/components/Drawer";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import type { Profession } from "../../../../professions/web/types/profession.types";
import type {
  Character,
  CharacterInput
} from "../types/character.types";
import { CharacterForm } from "./CharacterForm";

type CharacterDrawerProps = {
  character: Character | null;
  professions: Profession[];
  professionsLoading: boolean;
  onClose: () => void;
  onSubmit: (
    input: CharacterInput
  ) => Promise<void>;
};

/*
 * Adding/editing a character is occasional administration - it now
 * lives behind a deliberate "Add character" action instead of
 * permanently occupying half the roster page.
 */
export function CharacterDrawer({
  character,
  professions,
  professionsLoading,
  onClose,
  onSubmit
}: CharacterDrawerProps) {
  return (
    <Drawer
      onClose={onClose}
      title={
        character
          ? `Edit ${character.name}`
          : "Add Character"
      }
    >
      {professionsLoading ? (
        <LoadingPanel />
      ) : (
        <CharacterForm
          character={character}
          key={
            character?.id ??
            "new-character"
          }
          onCancel={onClose}
          onSubmit={onSubmit}
          professions={professions}
        />
      )}
    </Drawer>
  );
}
