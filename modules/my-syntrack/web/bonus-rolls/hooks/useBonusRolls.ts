import { useCallback, useEffect, useState } from "react";
import {
  clearBonusRollResult,
  createBonusRoll,
  deleteBonusRoll,
  listBonusRolls,
  recordBonusRollResult,
  updateBonusRollTarget
} from "../api/bonusRollApi";
import type {
  BonusRoll,
  BonusRollCreateInput,
  BonusRollResultInput
} from "../types/bonusRoll.types";

export type BonusRollActions = {
  rolls: BonusRoll[];
  isLoading: boolean;
  error: string | null;
  create: (input: BonusRollCreateInput) => Promise<void>;
  changeTarget: (id: string, targetItemId: number | null) => Promise<void>;
  recordResult: (id: string, input: BonusRollResultInput) => Promise<void>;
  clearResult: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Bonus Rolls could not be loaded.";
}

export function useBonusRolls(): BonusRollActions {
  const [rolls, setRolls] = useState<BonusRoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listBonusRolls()
      .then((response) => {
        if (!cancelled) setRolls(response.items);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(message(caught));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Runs a mutation, replaces/removes the row, surfaces failures. */
  const mutate = useCallback(async (run: () => Promise<BonusRoll | null>, removedId?: string) => {
    setError(null);

    try {
      const row = await run();

      setRolls((current) => {
        if (removedId) return current.filter((entry) => entry.id !== removedId);
        if (!row) return current;
        return current.some((entry) => entry.id === row.id)
          ? current.map((entry) => (entry.id === row.id ? row : entry))
          : [row, ...current];
      });
    } catch (caught) {
      setError(message(caught));
      throw caught;
    }
  }, []);

  return {
    rolls,
    isLoading,
    error,
    create: (input) => mutate(() => createBonusRoll(input)),
    changeTarget: (id, targetItemId) => mutate(() => updateBonusRollTarget(id, targetItemId)),
    recordResult: (id, input) => mutate(() => recordBonusRollResult(id, input)),
    clearResult: (id) => mutate(() => clearBonusRollResult(id)),
    remove: (id) => mutate(() => deleteBonusRoll(id).then(() => null), id)
  };
}
