import type { ReactNode } from "react";
import { WowClassIcon } from "./WowClassIcon";

export function CharacterNameWithIcon({
  wowClassName,
  size = "sm",
  children
}: {
  wowClassName: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  return (
    <span className="character-name-with-icon">
      <WowClassIcon size={size} wowClassName={wowClassName} />
      {children}
    </span>
  );
}
