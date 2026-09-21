export type PublicCraftStatus =
  | "SAFE"
  | "CONCENTRATION"
  | "NOT_SAFE"
  | "UNKNOWN";

export type PublicCrafterShareRecipe = {
  name: string;
  itemQuality: string | null;
  itemLevel: number | null;
  iconUrl: string | null;
  resultQuality: number | null;
  craftStatus: PublicCraftStatus;
  slotName: string | null;
};

export type PublicCrafterShareProfession = {
  name: string;
  recipes: PublicCrafterShareRecipe[];
};

export type PublicCrafterShareCharacter = {
  name: string;
  realm: string;
  className: string;
  professions: PublicCrafterShareProfession[];
};

export type PublicCrafterShareCard = {
  battleTag: string | null;
  characters: PublicCrafterShareCharacter[];
};

export type CrafterShareStatus = {
  enabled: boolean;
  publicUrl: string | null;
};
