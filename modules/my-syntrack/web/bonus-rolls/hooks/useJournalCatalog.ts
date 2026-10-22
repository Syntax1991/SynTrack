import { useEffect, useState } from "react";
import {
  listJournalEncounters,
  listJournalInstances,
  listJournalLoot
} from "../api/bonusRollApi";
import type {
  JournalEncounter,
  JournalInstance,
  JournalLootItem
} from "../types/bonusRoll.types";

type Loadable<T> = {
  items: T[];
  isLoading: boolean;
  error: string | null;
};

const idle = { items: [], isLoading: false, error: null };

/*
 * Loads one dropdown level of the Journal catalog. A null key means
 * "nothing selected above" and yields an empty, idle list.
 */
function useCatalogLevel<T>(key: string | null, load: () => Promise<{ items: T[] }>): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>(idle);

  useEffect(() => {
    if (key === null) {
      setState(idle);
      return;
    }

    let cancelled = false;
    setState({ items: [], isLoading: true, error: null });

    load()
      .then((response) => {
        if (!cancelled) setState({ items: response.items, isLoading: false, error: null });
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({
            items: [],
            isLoading: false,
            error: caught instanceof Error ? caught.message : "Journal data could not be loaded."
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // load is derived from key; key is the only real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

export function useJournalInstances(): Loadable<JournalInstance> {
  return useCatalogLevel("instances", listJournalInstances);
}

export function useJournalEncounters(instanceId: number | null): Loadable<JournalEncounter> {
  return useCatalogLevel(instanceId === null ? null : `encounters:${instanceId}`, () =>
    listJournalEncounters(instanceId!)
  );
}

export function useJournalLoot(instanceId: number | null, encounterId: number | null): Loadable<JournalLootItem> {
  return useCatalogLevel(
    instanceId === null || encounterId === null ? null : `loot:${instanceId}:${encounterId}`,
    () => listJournalLoot(instanceId!, encounterId!)
  );
}
