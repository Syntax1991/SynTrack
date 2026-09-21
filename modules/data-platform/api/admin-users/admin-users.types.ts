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

export type AdminUserAccountRecord = {
  id: string;
  battleNetAccountId: string | null;
  battleTag: string | null;
  status: string;
  createdAt: Date;
  characterCount: number;
  shareEnabled: boolean;
  lastSessionAt: Date | null;
};

export type AdminUsersRepositoryContract = {
  listAccounts(): Promise<AdminUserAccountRecord[]>;
  findAccountById(id: string): Promise<{
    id: string;
    battleNetAccountId: string | null;
    battleTag: string | null;
    status: string;
  } | null>;
  setStatus(id: string, status: string): Promise<unknown>;
  deleteSessions(raiderAccountId: string): Promise<unknown>;
  revokeDevices(raiderAccountId: string): Promise<unknown>;
  disableShare(raiderAccountId: string): Promise<unknown>;
  deleteAccount(raiderAccountId: string): Promise<void>;
};
