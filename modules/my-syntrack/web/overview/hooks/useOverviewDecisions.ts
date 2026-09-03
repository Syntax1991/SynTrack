import {
  useCallback,
  useEffect,
  useState
} from "react";
import { getOverviewDecisions } from "../api/overviewDecisionApi";
import type { OverviewDecisionResponse } from "../types/overviewDecision.types";

export function useOverviewDecisions() {
  const [overview, setOverview] =
    useState<OverviewDecisionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getOverviewDecisions();

        if (!cancelled) {
          setOverview(result);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setOverview(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load Overview"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    overview,
    isLoading,
    error,
    refetch
  };
}
