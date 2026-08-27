import type {
  CharacterWeeklyState,
  TrackerDefinitionView
} from "../../overview/types/overview.types";

/*
 * Mirrors the backend's CharacterControlDetailResponse
 * (overview.types.ts) - the Character Detail Hub's read model is the
 * exact same CharacterWeeklyState one Overview row already carries,
 * scoped to a single character. No new shape is invented here.
 */
export type CharacterControlDetailResponse = {
  period: {
    key: string;
    startsAt: string;
    endsAt: string;
  };
  character: CharacterWeeklyState;
  trackerColumns: TrackerDefinitionView[];
};
