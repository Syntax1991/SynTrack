export type WowMediaIconsView = {
  classes: Record<string, string | null>;
  professions: Record<string, string | null>;
};

export const EMPTY_WOW_MEDIA_ICONS: WowMediaIconsView = {
  classes: {},
  professions: {}
};
