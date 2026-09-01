import { useCallback, useEffect, useState } from "react";
import { getSettingsTrustSnapshot } from "../api/settingsTrustApi";
import type { SettingsTrustSnapshot } from "../types/settingsTrust.types";

export function useSettingsTrust() {
  const [snapshot, setSnapshot] =
    useState<SettingsTrustSnapshot | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const reload = useCallback(
    async () => {
      setError(null);
      setIsLoading(true);

      try {
        setSnapshot(
          await getSettingsTrustSnapshot()
        );
      }
      catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Settings trust state could not be loaded."
        );
      }
      finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    snapshot,
    isLoading,
    error,
    reload
  };
}
