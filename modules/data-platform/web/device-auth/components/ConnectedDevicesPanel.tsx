import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { useConnectedDevices } from "../hooks/useConnectedDevices";

function formatTimestamp(
  value: string | null
): string {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export function ConnectedDevicesPanel() {
  const {
    devices,
    isLoading,
    error,
    revoke
  } = useConnectedDevices();

  return (
    <section className="panel character-tags-manager">
      <h2>Connected Devices</h2>

      <p className="character-tags-manager-hint">
        Desktop clients that can sync
        your addon data. Revoking a
        device disconnects it
        immediately - you can reconnect
        it later from the client.
      </p>

      {error && (
        <p className="character-tags-manager-error">
          {error}
        </p>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : devices.length === 0 ? (
        <p className="muted-text">
          No devices connected yet.
        </p>
      ) : (
        <ul className="character-tags-manager-list">
          {devices.map((device) => (
            <li key={device.id}>
              <span>
                {device.name}
                {" - last synced "}
                {formatTimestamp(
                  device.lastSeenAt
                )}
              </span>

              {device.revokedAt ? (
                <span className="matrix-token matrix-token-not-tracked">
                  Revoked
                </span>
              ) : (
                <button
                  className="text-button danger"
                  onClick={() => {
                    void revoke(
                      device.id
                    );
                  }}
                  type="button"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
