import { useEffect, useState } from "react";
import type { SeasonChecklistResponse } from "../../../api/season-checklist/season-checklist.types.js";
import { getSeasonChecklist } from "../api/seasonChecklistApi";

export function useSeasonChecklist() {
  const [checklist, setChecklist] =
    useState<SeasonChecklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const next = await getSeasonChecklist();

        if (!cancelled) {
          setChecklist(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Season checklist could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { checklist, isLoading, error };
}
