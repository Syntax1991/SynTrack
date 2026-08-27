import { useCallback, useEffect, useState } from "react";
import {
  activateTrackerScopeProfile,
  createTrackerScopeProfile,
  listTrackerScopeProfiles
} from "../api/seasonApi";
import type {
  TrackerScopeProfileCreateInput,
  TrackerScopeProfileView
} from "../types/season.types";

export function useTrackerScopeProfiles() {
  const [profiles, setProfiles] =
    useState<
      TrackerScopeProfileView[]
    >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await listTrackerScopeProfiles();

        setProfiles(response.items);
      }
      catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Tracker scope profiles could not be loaded."
        );
      }
      finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function create(
    input: TrackerScopeProfileCreateInput
  ) {
    await createTrackerScopeProfile(
      input
    );
    await load();
  }

  async function activate(
    key: string
  ) {
    await activateTrackerScopeProfile(
      key
    );
    await load();
  }

  return {
    profiles,
    isLoading,
    error,
    create,
    activate,
    reload: load
  };
}
