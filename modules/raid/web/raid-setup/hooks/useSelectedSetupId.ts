import { useEffect, useState } from "react";
import type { RaidSetup } from "../types/raidSetup.types";

function storageKeyFor(
  eventId: string
): string {
  return `syntrack:selectedSetupId:${eventId}`;
}

/**
 * The ONE shared "which Setup is active for this event" state — kept
 * in localStorage (keyed per event) rather than component state, so
 * the Setup/BossRoster page and the separate Cooldown Planner page
 * (a different top-level route, so they can't share React state
 * directly) both resolve the same selection without inventing a
 * second, independent selector concept. If the stored id no longer
 * matches any real Setup for this event (deleted, or simply never
 * selected yet), falls back to the "main" Setup, then to whichever
 * Setup loaded first — never silently to nothing.
 */
export function useSelectedSetupId(
  eventId: string | null,
  setups: RaidSetup[]
) {
  const [selectedSetupId, setSelectedSetupId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!eventId || setups.length === 0) {
      return;
    }

    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(
            storageKeyFor(eventId)
          )
        : null;

    const stillValid = setups.some(
      (setup) => setup.id === stored
    );

    if (stillValid) {
      setSelectedSetupId(stored);
      return;
    }

    const fallback =
      setups.find(
        (setup) => setup.key === "main"
      ) ?? setups[0];

    setSelectedSetupId(
      fallback?.id ?? null
    );
  }, [eventId, setups]);

  const selectSetup = (setupId: string) => {
    setSelectedSetupId(setupId);

    if (eventId && typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKeyFor(eventId),
        setupId
      );
    }
  };

  return { selectedSetupId, selectSetup };
}
