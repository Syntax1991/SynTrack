import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  createCooldownAssignment,
  deleteCooldownAssignment,
  getCooldownAssignmentsForSetup,
  updateCooldownAssignment
} from "../api/cooldownApi";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";

/**
 * Scoped by Setup (a Setup belongs to exactly one RaidEvent, so this
 * already covers every boss of that event) — never by bossId alone,
 * so two Setups sharing the same boss can never see each other's
 * assignments.
 */
export function useCooldownAssignments(
  setupId: string | null
) {
  const [
    assignments,
    setAssignments
  ] = useState<
    RaidCooldownAssignment[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadAssignments =
    useCallback(async () => {
      if (!setupId) {
        setAssignments([]);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const response =
          await getCooldownAssignmentsForSetup(
            setupId
          );

        setAssignments(
          response.items
        );
      }
      catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Cooldown assignments could not be loaded."
        );
      }
      finally {
        setIsLoading(false);
      }
    }, [setupId]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const addAssignment = async (
    bossId: string,
    input: RaidCooldownAssignmentInput
  ) => {
    if (!setupId) {
      return;
    }

    setError(null);

    try {
      await createCooldownAssignment(
        setupId,
        bossId,
        input
      );

      await loadAssignments();
    }
    catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Assignment could not be added.";

      setError(message);
      throw createError;
    }
  };

  const editAssignment = async (
    bossId: string,
    assignmentId: string,
    input: RaidCooldownAssignmentInput
  ) => {
    if (!setupId) {
      return;
    }

    setError(null);

    try {
      await updateCooldownAssignment(
        setupId,
        bossId,
        assignmentId,
        input
      );

      await loadAssignments();
    }
    catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Assignment could not be updated.";

      setError(message);
      throw updateError;
    }
  };

  const removeAssignment = async (
    bossId: string,
    assignmentId: string
  ) => {
    if (!setupId) {
      return;
    }

    setError(null);

    try {
      await deleteCooldownAssignment(
        setupId,
        bossId,
        assignmentId
      );

      await loadAssignments();
    }
    catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Assignment could not be removed.";

      setError(message);
      throw deleteError;
    }
  };

  return {
    assignments,
    isLoading,
    error,
    addAssignment,
    editAssignment,
    removeAssignment
  };
}
