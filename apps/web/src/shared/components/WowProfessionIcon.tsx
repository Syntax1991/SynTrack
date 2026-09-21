import { useState } from "react";
import { useWowMediaIcons } from "../wow-media/useWowMediaIcons";

type WowProfessionIconSize = "sm" | "md" | "lg";

type WowProfessionIconProps = {
  professionKey: string;
  name: string;
  size?: WowProfessionIconSize;
};

function professionGlyph(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function WowProfessionIcon({
  professionKey,
  name,
  size = "sm"
}: WowProfessionIconProps) {
  const icons = useWowMediaIcons();
  const iconUrl = icons.professions[professionKey] ?? null;
  const [hasLoadError, setHasLoadError] = useState(false);

  if (!iconUrl || hasLoadError) {
    return (
      <span
        aria-hidden="true"
        className={`wow-media-icon wow-media-icon-${size} wow-media-icon-fallback wow-media-icon-profession`}
        title={name}
      >
        {professionGlyph(name)}
      </span>
    );
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className={`wow-media-icon wow-media-icon-${size} wow-media-icon-image`}
      onError={() => setHasLoadError(true)}
      src={iconUrl}
      title={name}
    />
  );
}
