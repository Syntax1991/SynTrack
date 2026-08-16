import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  addPlanMember,
  getPlanMembersForSetupAndBoss,
  removePlanMember
} from "../api/cooldownApi";
import type { RaidCooldownPlanMember } from "../types/cooldown.types";

/**
 * Cooldown Plan Participants — "this member's real spell lanes render
 * on the Timeline canvas" — are persisted (RaidCooldownPlanMember),
 * distinct from Setup/BossRoster participation and from actual
 * RaidCooldownAssignment rows. Scoped by Setup+Boss together: the
 * same Boss can have a different Cooldown Plan under a different
 * Setup for the same event, so both ids are required. Survives
 * refresh; the server rejects removing a member who still has real
 * assignments under this exact Setup+Boss (409), which surfaces here
 * as `error` rather than silently deleting anything.
 */
export function usePlanMembers(
  setupId: string | null,
  bossId: string | null
) {
  const [members, setMembers] =
    useState<
      RaidCooldownPlanMember[]
    >([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadMembers = useCallback(
    async () => {
      if (!setupId || !bossId) {
        setMembers([]);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const response =
          await getPlanMembersForSetupAndBoss(
            setupId,
            bossId
          );

        setMembers(response.items);
      }
      catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Cooldown Plan participants could not be loaded."
        );
      }
      finally {
        setIsLoading(false);
      }
    },
    [setupId, bossId]
  );

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const addMember = async (
    memberId: string
  ) => {
    if (!setupId || !bossId) {
      return;
    }

    setError(null);

    try {
      await addPlanMember(
        setupId,
        bossId,
        memberId
      );

      await loadMembers();
    }
    catch (addError) {
      const message =
        addError instanceof Error
          ? addError.message
          : "Player could not be added to the Cooldown Plan.";

      setError(message);
      throw addError;
    }
  };

  const removeMember = async (
    memberId: string
  ) => {
    if (!setupId || !bossId) {
      return;
    }

    setError(null);

    try {
      await removePlanMember(
        setupId,
        bossId,
        memberId
      );

      await loadMembers();
    }
    catch (removeError) {
      const message =
        removeError instanceof Error
          ? removeError.message
          : "Player could not be removed from the Cooldown Plan.";

      setError(message);
      throw removeError;
    }
  };

  return {
    members,
    isLoading,
    error,
    addMember,
    removeMember
  };
}
