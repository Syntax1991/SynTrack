import { useState } from "react";
import { useDeviceApproval } from "../hooks/useDeviceApproval";

function readLinkDeviceCodeFromUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(
    window.location.search
  );

  return params.get("linkDevice") ?? "";
}

/*
 * The desktop client shows the user a short userCode and opens this page.
 * Approving here only flips the link PENDING -> APPROVED - the backend
 * independently re-checks the raider session before that happens, so this
 * form is a convenience, not the actual security boundary.
 */
export function DeviceApprovalPanel() {
  const [initialUserCode] = useState(
    readLinkDeviceCodeFromUrl
  );

  const {
    userCode,
    setUserCode,
    isApproving,
    approvedUserCode,
    error,
    approve
  } = useDeviceApproval(
    initialUserCode
  );

  return (
    <section className="panel character-tags-manager">
      <h2>Connect a Device</h2>

      <p className="character-tags-manager-hint">
        Enter the code shown in the
        SynTrack desktop client to
        approve it for syncing your
        addon data.
      </p>

      {error && (
        <p className="character-tags-manager-error">
          {error}
        </p>
      )}

      {approvedUserCode && (
        <p className="matrix-token matrix-token-ready">
          {approvedUserCode} approved.
          The client will finish
          connecting automatically.
        </p>
      )}

      <form
        className="character-tags-manager-form"
        onSubmit={(event) => {
          event.preventDefault();
          void approve();
        }}
      >
        <input
          aria-label="Device code"
          onChange={(event) =>
            setUserCode(
              event.target.value
            )
          }
          placeholder="XXXX-XXXX"
          type="text"
          value={userCode}
        />

        <button
          disabled={
            isApproving ||
            userCode.trim().length === 0
          }
          type="submit"
        >
          Approve
        </button>
      </form>
    </section>
  );
}
