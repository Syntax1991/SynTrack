export type TagView = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TagCreateInput = {
  name: string;
  color?: string;
};

export type TagUpdateInput = {
  name?: string;
  color?: string | null;
  sortOrder?: number;
};

export type TagAssignment = {
  characterId: string;
  tagId: string;
};
