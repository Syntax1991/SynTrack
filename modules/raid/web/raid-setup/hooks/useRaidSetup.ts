import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  addSetupMembers,
  createSetup as createSetupRequest,
  listSetupsForEvent,
  removeSetupMember,
  updateSetupRosterFromTeam
} from "../api/raidSetupApi";
import type { RaidSetup } from "../types/raidSetup.types";
import { useSelectedSetupId } from "./useSelectedSetupId";

/**
 * Multiple Setups can exist per event now — this hook owns the full
 * list plus which one is currently selected (via useSelectedSetupId,
 * the ONE shared selection mechanism also used by the Cooldown
 * Planner page). `setup` is always the currently SELECTED Setup, so
 * every mutation below (addMembers/removeMember/updateRosterFromTeam)
 * operates on whichever Setup the officer is actually looking at —
 * never implicitly "the" Setup, since there's no longer only one.
 */
export function useRaidSetup(
  eventId: string | null
) {
  const [setups, setSetups] = useState<
    RaidSetup[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const {
    selectedSetupId,
    selectSetup
  } = useSelectedSetupId(eventId, setups);

  const loadSetups = useCallback(
    async () => {
      if (!eventId) {
        setSetups([]);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const response =
          await listSetupsForEvent(
            eventId
          );

        setSetups(response.items);
      }
      catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Setups could not be loaded."
        );
      }
      finally {
        setIsLoading(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    void loadSetups();
  }, [loadSetups]);

  const setup =
    setups.find(
      (candidate) =>
        candidate.id === selectedSetupId
    ) ?? null;

  const replaceSetup = (
    updated: RaidSetup
  ) => {
    setSetups((current) =>
      current.map((candidate) =>
        candidate.id === updated.id
          ? updated
          : candidate
      )
    );
  };

  const createSetup = async (
    name: string
  ) => {
    if (!eventId) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const created =
        await createSetupRequest(
          eventId,
          name
        );

      setSetups((current) => [
        ...current,
        created
      ]);

      selectSetup(created.id);
    }
    catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Setup could not be created."
      );

      throw createError;
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const addMembers = async (
    memberIds: string[]
  ) => {
    if (!setup) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        await addSetupMembers(
          setup.id,
          memberIds
        );

      replaceSetup(response);
    }
    catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Member could not be added."
      );

      throw addError;
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const removeMember = async (
    memberId: string
  ) => {
    if (!setup) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        await removeSetupMember(
          setup.id,
          memberId
        );

      replaceSetup(response);
    }
    catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Member could not be removed."
      );

      throw removeError;
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const updateRosterFromTeam = async () => {
    if (!setup) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        await updateSetupRosterFromTeam(
          setup.id
        );

      replaceSetup(response);
    }
    catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Roster could not be synced."
      );

      throw updateError;
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return {
    setups,
    setup,
    selectedSetupId,
    selectSetup,
    createSetup,
    isLoading,
    isSubmitting,
    error,
    addMembers,
    removeMember,
    updateRosterFromTeam
  };
}
