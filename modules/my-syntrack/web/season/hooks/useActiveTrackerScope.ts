import { useEffect, useState } from "react";
import { getActiveTrackerScopeProfile } from "../api/seasonApi";
import type { TrackerScopeProfileView } from "../types/season.types";

/*
 * The backend is authoritative for which tracker scope is active -
 * this replaces the old hardcoded ACTIVE_TRACKER_SCOPE_KEY constant
 * that used to be duplicated in both the frontend and backend.
 */
export function useActiveTrackerScope(): {
  activeScope: TrackerScopeProfileView | null;
  isLoading: boolean;
  error: string | null;
} {
  const [activeScope, setActiveScope] =
    useState<TrackerScopeProfileView | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          await getActiveTrackerScopeProfile();

        if (!cancelled) {
          setActiveScope(result);
        }
      }
      catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Active tracker scope could not be loaded."
          );
        }
      }
      finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    activeScope,
    isLoading,
    error
  };
}
