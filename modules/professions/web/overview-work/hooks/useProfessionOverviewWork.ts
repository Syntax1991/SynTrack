import {
  useEffect,
  useState
} from "react";
import { getProfessionOverviewWork } from "../api/professionOverviewWorkApi";
import type {
  ProfessionOverviewWorkRow,
  ProfessionOverviewWorkSummary
} from "../types/professionOverviewWork.types";

type ProfessionOverviewWorkState = {
  summary: ProfessionOverviewWorkSummary | null;
  rows: ProfessionOverviewWorkRow[];
  isLoading: boolean;
  error: string | null;
};

const emptyState: ProfessionOverviewWorkState = {
  summary: null,
  rows: [],
  isLoading: true,
  error: null
};

export function useProfessionOverviewWork():
  ProfessionOverviewWorkState {
  const [state, setState] =
    useState<ProfessionOverviewWorkState>(
      emptyState
    );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((current) => ({
        ...current,
        isLoading: true,
        error: null
      }));

      try {
        const result =
          await getProfessionOverviewWork();

        if (!cancelled) {
          setState({
            summary: result.summary,
            rows: result.rows,
            isLoading: false,
            error: null
          });
        }
      }
      catch (loadError) {
        if (!cancelled) {
          setState({
            summary: null,
            rows: [],
            isLoading: false,
            error:
              loadError instanceof Error
                ? loadError.message
                : "Failed to load profession work."
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
