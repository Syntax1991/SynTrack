import {
  useCallback,
  useEffect,
  useState
} from "react";
import { getOverview } from "../api/overviewApi";
import type { OverviewResponse } from "../types/overview.types";

type OverviewState = {
  overview: OverviewResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useOverview(): OverviewState {
  const [overview, setOverview] =
    useState<OverviewResponse | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [reloadToken, setReloadToken] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result =
          await getOverview();

        if (!cancelled) {
          setOverview(result);
        }
      }
      catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Overview could not be loaded."
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
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken(
      (previous) => previous + 1
    );
  }, []);

  return {
    overview,
    isLoading,
    error,
    refetch
  };
}
