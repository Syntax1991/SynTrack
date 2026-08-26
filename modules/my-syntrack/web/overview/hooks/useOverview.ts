import {
  useEffect,
  useState
} from "react";
import { getOverview } from "../api/overviewApi";
import type { OverviewResponse } from "../types/overview.types";

type OverviewState = {
  overview: OverviewResponse | null;
  isLoading: boolean;
  error: string | null;
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

  useEffect(() => {
    async function load() {
      try {
        setOverview(
          await getOverview()
        );
      }
      catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Overview could not be loaded."
        );
      }
      finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  return {
    overview,
    isLoading,
    error
  };
}
