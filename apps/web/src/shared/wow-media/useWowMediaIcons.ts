import { createContext, useContext } from "react";
import {
  EMPTY_WOW_MEDIA_ICONS,
  type WowMediaIconsView
} from "./wowMediaIcons.types";

export const WowMediaIconsContext = createContext<WowMediaIconsView>(
  EMPTY_WOW_MEDIA_ICONS
);

export function useWowMediaIcons(): WowMediaIconsView {
  return useContext(WowMediaIconsContext);
}
