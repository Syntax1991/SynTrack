import { useCallback, useEffect, useState } from "react";
import type { SeasonChecklistResponse } from "../../../api/season-checklist/season-checklist.types.js";
import { getSeasonChecklist } from "../api/seasonChecklistApi";

export function useSeasonChecklist() {
  const [checklist, setChecklist] =
    useState<SeasonChecklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const next = await getSeasonChecklist();
      setChecklist(next);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Season checklist could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { checklist, isLoading, error, reload: load };
}
