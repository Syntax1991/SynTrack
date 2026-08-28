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
  color?: string | undefined;
};

export type TagUpdateInput = {
  name?: string | undefined;
  color?: string | null | undefined;
  sortOrder?: number | undefined;
};

export type TagAssignment = {
  characterId: string;
  tagId: string;
};

export type TagBulkAssignInput = {
  characterIds: string[];
  addTagIds: string[];
  removeTagIds: string[];
};
