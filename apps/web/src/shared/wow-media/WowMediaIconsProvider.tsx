import { useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "../api/httpClient";
import { WowMediaIconsContext } from "./useWowMediaIcons";
import {
  EMPTY_WOW_MEDIA_ICONS,
  type WowMediaIconsView
} from "./wowMediaIcons.types";

export function WowMediaIconsProvider({
  children
}: {
  children: ReactNode;
}) {
  const [icons, setIcons] = useState<WowMediaIconsView>(
    EMPTY_WOW_MEDIA_ICONS
  );

  useEffect(() => {
    let cancelled = false;

    apiRequest<WowMediaIconsView>("/wow-media/icons")
      .then((payload) => {
        if (!cancelled) {
          setIcons(payload);
        }
      })
      .catch(() => {
        /*
         * Icon components keep their glyph fallback. A failed catalog
         * fetch must never invent CDN filenames.
         */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WowMediaIconsContext.Provider value={icons}>
      {children}
    </WowMediaIconsContext.Provider>
  );
}
