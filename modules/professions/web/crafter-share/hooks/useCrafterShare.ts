import { useCallback, useEffect, useState } from "react";
import {
  disableCrafterShare,
  enableCrafterShare,
  getCrafterShareStatus
} from "../api/crafterShareApi";
import type { CrafterShareStatus } from "../types/crafterShare.types";

type CrafterShareState = CrafterShareStatus & {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

const idleStatus: CrafterShareStatus = {
  enabled: false,
  publicUrl: null
};

export function useCrafterShare() {
  const [state, setState] = useState<CrafterShareState>({
    ...idleStatus,
    isLoading: true,
    isSaving: false,
    error: null
  });

  const refresh = useCallback(async () => {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null
    }));

    try {
      const status = await getCrafterShareStatus();

      setState({
        ...status,
        isLoading: false,
        isSaving: false,
        error: null
      });
    } catch (loadError) {
      setState((current) => ({
        ...current,
        isLoading: false,
        isSaving: false,
        error:
          loadError instanceof Error
            ? loadError.message
            : "Crafter share could not be loaded."
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setState((current) => ({
      ...current,
      isSaving: true,
      error: null
    }));

    try {
      const status = await enableCrafterShare();

      setState({
        ...status,
        isLoading: false,
        isSaving: false,
        error: null
      });
    } catch (saveError) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error:
          saveError instanceof Error
            ? saveError.message
            : "Crafter share could not be enabled."
      }));
    }
  }, []);

  const disable = useCallback(async () => {
    setState((current) => ({
      ...current,
      isSaving: true,
      error: null
    }));

    try {
      const status = await disableCrafterShare();

      setState({
        ...status,
        isLoading: false,
        isSaving: false,
        error: null
      });
    } catch (saveError) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error:
          saveError instanceof Error
            ? saveError.message
            : "Crafter share could not be disabled."
      }));
    }
  }, []);

  return {
    ...state,
    enable,
    disable
  };
}
