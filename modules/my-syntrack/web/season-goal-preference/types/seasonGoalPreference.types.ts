export type SeasonGoalTargetType = "NONE" | "NUMBER" | "ENUM";
export type SeasonGoalPreferenceScope = "CHARACTER" | "WARBAND";

export type SeasonGoalDefinition = {
  key: string;
  label: string;
  detail: string;
  scope: SeasonGoalPreferenceScope;
  targetType: SeasonGoalTargetType;
  defaultEnabled: boolean;
  defaultNumericTarget: number | null;
  defaultEnumTarget: string | null;
  numericPresets: number[] | null;
  enumOptions: string[] | null;
  minNumericTarget: number | null;
};

export type SeasonGoalPreferenceValue = {
  enabled: boolean;
  numericTarget: number | null;
  enumTarget: string | null;
};

export type ManageGoalsCharacterView = {
  id: string;
  name: string;
  realm: string;
  className: string;
  preferences: Record<string, SeasonGoalPreferenceValue>;
};

export type ManageGoalsView = {
  definitions: SeasonGoalDefinition[];
  characters: ManageGoalsCharacterView[];
  warband: Record<string, SeasonGoalPreferenceValue>;
};

export type SeasonGoalPreferenceInput = {
  goalKey: string;
  characterId: string | null;
  enabled: boolean;
  numericTarget: number | null;
  enumTarget: string | null;
};
