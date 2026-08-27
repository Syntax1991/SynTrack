export type TrackerScopeProfileView = {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TrackerScopeProfileCreateInput = {
  key: string;
  name: string;
};
