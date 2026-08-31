import { useCallback, useEffect, useState } from "react";
import {
  getRemovedCharacters,
  restoreRemovedCharacter as restoreRemovedCharacterRequest,
  type RemovedCharacter
} from "../api/characterApi";

export function useRemovedCharacters() {
  const [items, setItems] = useState<RemovedCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadRemoved = useCallback(async () => {
    setError(null);

    try {
      const response = await getRemovedCharacters();
      setItems(response.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Removed characters could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRemoved();
  }, [loadRemoved]);

  const restoreCharacter = async (removedId: string) => {
    setError(null);
    setRestoringId(removedId);

    try {
      await restoreRemovedCharacterRequest(removedId);
      await loadRemoved();
    } catch (restoreError) {
      const message =
        restoreError instanceof Error
          ? restoreError.message
          : "Character could not be restored.";

      setError(message);
      throw restoreError;
    } finally {
      setRestoringId(null);
    }
  };

  return {
    items,
    isLoading,
    error,
    restoringId,
    reload: loadRemoved,
    restoreCharacter
  };
}
