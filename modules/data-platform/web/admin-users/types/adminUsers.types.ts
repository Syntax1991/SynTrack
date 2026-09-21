export type AdminUserListItem = {
  id: string;
  battleTag: string | null;
  status: string;
  createdAt: string;
  lastSessionAt: string | null;
  characterCount: number;
  shareEnabled: boolean;
  isAdmin: boolean;
};
