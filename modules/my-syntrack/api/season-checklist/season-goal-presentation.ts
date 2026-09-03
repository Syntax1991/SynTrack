/**
 * Product-facing Season goal copy. External IDs stay in catalogs only.
 */
export type SeasonGoalPresentation = {
  title: string;
  detail: string;
  incompleteLabel: string;
  incompleteAction: string;
};

export const SEASON_GOAL_PRESENTATION: Record<string, SeasonGoalPresentation> = {
  portals: {
    title: "Dungeon portals",
    detail: "Timed +10 dungeon portals for Midnight Season 2",
    incompleteLabel: "✕",
    incompleteAction: "Earn remaining dungeon portals"
  },
  "serpent-scion": {
    title: "Serpent Scion",
    detail: "Midnight Season 2: Serpent Scion",
    incompleteLabel: "✕",
    incompleteAction: "Earn Serpent Scion"
  },
  "cracked-keystone": {
    title: "Cracked Keystone",
    detail: "Complete the Season 2 Cracked Keystone quest",
    incompleteLabel: "✕",
    incompleteAction: "Complete Cracked Keystone"
  },
  "nemesis-aztarec": {
    title: "Azta'rec (Nemesis)",
    detail: "Defeat Azta'rec on ?? during Midnight Season 2",
    incompleteLabel: "✕",
    incompleteAction: "Defeat Azta'rec on ??"
  },
  "aotc-ulatek": {
    title: "AOTC: Ula'tek",
    detail: "Ahead of the Curve: Ula'tek",
    incompleteLabel: "✕ AOTC",
    incompleteAction: "Earn AOTC: Ula'tek"
  },
  "ce-ulatek": {
    title: "Cutting Edge: Ula'tek",
    detail: "Cutting Edge: Ula'tek",
    incompleteLabel: "✕",
    incompleteAction: "Earn Cutting Edge: Ula'tek"
  },
  "tier-visual": {
    title: "Sssensational!",
    detail: "Enhanced Season 2 tier visuals",
    incompleteLabel: "✕",
    incompleteAction: "Earn Sssensational!"
  }
};

export function seasonGoalPresentation(goalKey: string): SeasonGoalPresentation {
  return (
    SEASON_GOAL_PRESENTATION[goalKey] ?? {
      title: "Season goal",
      detail: "Season goal",
      incompleteLabel: "✕",
      incompleteAction: "Complete season goal"
    }
  );
}
