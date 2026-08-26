import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  createTrackerDefinition,
  listTrackerDefinitions,
  updateTrackerDefinition
} from "../api/trackerApi";
import type {
  TrackerDefinitionCreateInput,
  TrackerDefinitionMetadataUpdate,
  TrackerDefinitionView
} from "../types/tracker.types";

export function useTrackerDefinitions(
  scopeKey: string
) {
  const [definitions, setDefinitions] =
    useState<
      TrackerDefinitionView[]
    >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      setIsLoading(true);

      try {
        setDefinitions(
          await listTrackerDefinitions(
            scopeKey
          )
        );
        setError(null);
      }
      catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Trackers could not be loaded."
        );
      }
      finally {
        setIsLoading(false);
      }
    },
    [scopeKey]
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function create(
    input: Omit<
      TrackerDefinitionCreateInput,
      "scopeKey"
    >
  ) {
    await createTrackerDefinition({
      ...input,
      scopeKey
    });
    await load();
  }

  async function updateMetadata(
    id: string,
    update: TrackerDefinitionMetadataUpdate
  ) {
    await updateTrackerDefinition(
      id,
      update
    );
    await load();
  }

  return {
    definitions,
    isLoading,
    error,
    create,
    updateMetadata,
    reload: load
  };
}
