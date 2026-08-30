export type RaiderSessionStatus = {
  battleTag: string | null;
  expiresAt: string;
};

export type RaiderAuthIntent =
  | "login"
  | "register";

export type RaiderPendingRegistrationInfo =
  {
    battleTag: string | null;
  };

export type RaiderSessionResult = {
  token: string;
  raiderAccountId: string;
  characters: unknown[];
};
