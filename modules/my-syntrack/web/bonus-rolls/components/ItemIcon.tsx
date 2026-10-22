import { useState } from "react";

type ItemIconProps = {
  iconUrl: string | null | undefined;
  size?: "sm" | "md" | "lg";
  /* Blizzard quality enum ("EPIC", "RARE", ...) - tints the frame. */
  quality?: string | null;
};

/*
 * Blizzard item icon with a quiet fallback tile when there is no icon
 * yet (or it fails to load) - never an invented image.
 */
export function ItemIcon({ iconUrl, size = "md", quality }: ItemIconProps) {
  const [failed, setFailed] = useState(false);
  const qualityClass = quality ? ` bonus-roll-item-icon-${quality.toLowerCase()}` : "";
  const className = `bonus-roll-item-icon bonus-roll-item-icon-${size}${qualityClass}`;

  if (!iconUrl || failed) {
    return <span aria-hidden="true" className={`${className} bonus-roll-item-icon-empty`} />;
  }

  return <img alt="" className={className} loading="lazy" onError={() => setFailed(true)} src={iconUrl} />;
}
