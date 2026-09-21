import { useState } from "react";
import { getClassColor, getClassInitials } from "../utils/classColors";
import { useWowMediaIcons } from "../wow-media/useWowMediaIcons";

type WowClassIconSize = "sm" | "md" | "lg";

type WowClassIconProps = {
  wowClassName: string;
  size?: WowClassIconSize;
};

export function WowClassIcon({
  wowClassName,
  size = "sm"
}: WowClassIconProps) {
  const icons = useWowMediaIcons();
  const iconUrl = icons.classes[wowClassName] ?? null;
  const [hasLoadError, setHasLoadError] = useState(false);

  if (!iconUrl || hasLoadError) {
    return (
      <span
        aria-hidden="true"
        className={`wow-media-icon wow-media-icon-${size} wow-media-icon-fallback wow-media-icon-class`}
        style={
          {
            "--syntrack-icon-color": getClassColor(wowClassName)
          } as never
        }
        title={wowClassName}
      >
        {getClassInitials(wowClassName)}
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
      title={wowClassName}
    />
  );
}
