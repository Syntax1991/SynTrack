import { useCallback, useEffect, useState } from "react";
import { getVaultMythicPlusOverview } from "../api/vaultMythicPlusApi";
import type { VaultMythicPlusResponse } from "../types/vaultMythicPlus.types";

type VaultMythicPlusState = {
  overview: VaultMythicPlusResponse | null;
  isLoading: boolean;
  error: string | null;
};

export function useVaultMythicPlus(): VaultMythicPlusState {
  const [overview, setOverview] = useState<VaultMythicPlusResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setError(null);

    try {
      setOverview(await getVaultMythicPlusOverview());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Vault progress could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  return {
    overview,
    isLoading,
    error
  };
}
