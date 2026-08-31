import { DeviceApprovalPanel } from "./DeviceApprovalPanel";

/*
 * The old human-typed-code flow, kept only for diagnostics/recovery -
 * per the codeless-connection product spec, a normal user must never
 * need this. Collapsed behind a native <details> disclosure (closed by
 * default) rather than shown as primary Devices-page UI, so
 * ConnectedDevicesPanel is what a normal visit to Settings -> Devices
 * actually shows first.
 */
export function AdvancedManualDeviceLinkPanel() {
  return (
    <details className="advanced-disclosure">
      <summary>
        Advanced - Link with a code
      </summary>

      <p className="character-tags-manager-hint">
        Most SynTrack desktop clients
        connect automatically via
        "Continue with Battle.net" -
        you should not normally need
        this.
      </p>

      <DeviceApprovalPanel />
    </details>
  );
}
