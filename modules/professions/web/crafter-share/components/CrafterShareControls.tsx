import { useState } from "react";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useCrafterShare } from "../hooks/useCrafterShare";

export function CrafterShareControls() {
  const share = useCrafterShare();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!share.publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(share.publicUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="crafter-share-controls">
      <div>
        <h2>Share with guild</h2>
        <p>
          Opt-in public crafter card. Guild members open the link without
          logging in and can filter for a specific item or listed item
          level. Armor, weapons, and jewelry only — bolts, reagents, and
          consumables stay off the card. Weeklies, equipped gear, and
          vault stay private.
        </p>
      </div>

      {share.error ? (
        <StatusMessage type="error">{share.error}</StatusMessage>
      ) : null}

      <div className="crafter-share-controls-actions">
        {share.enabled ? (
          <button
            disabled={share.isSaving || share.isLoading}
            onClick={() => {
              void share.disable();
              setCopied(false);
            }}
            type="button"
          >
            Stop sharing
          </button>
        ) : (
          <button
            disabled={share.isSaving || share.isLoading}
            onClick={() => {
              void share.enable();
            }}
            type="button"
          >
            Enable sharing
          </button>
        )}

        {share.publicUrl ? (
          <>
            <code>{share.publicUrl}</code>
            <button onClick={() => void copyLink()} type="button">
              {copied ? "Copied" : "Copy link"}
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
