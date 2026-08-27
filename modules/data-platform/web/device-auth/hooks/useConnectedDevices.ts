import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  listDevices,
  revokeDevice
} from "../api/deviceAuthApi";
import type { DeviceCredentialView } from "../types/device-auth.types";

export type ConnectedDevicesState = {
  devices: DeviceCredentialView[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  revoke: (id: string) => Promise<void>;
};

export function useConnectedDevices(): ConnectedDevicesState {
  const [devices, setDevices] = useState<
    DeviceCredentialView[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [reloadToken, setReloadToken] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await listDevices();

        if (!cancelled) {
          setDevices(response.items);
        }
      }
      catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Connected devices could not be loaded."
          );
        }
      }
      finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken(
      (previous) => previous + 1
    );
  }, []);

  const revoke = async (id: string) => {
    await revokeDevice(id);
    reload();
  };

  return {
    devices,
    isLoading,
    error,
    reload,
    revoke
  };
}
