export type RaiderSessionStatus = {
  battleTag: string | null;
  expiresAt: string;
  isAdmin: boolean;
};

export type RaiderRegistrationResult =
  | (RaiderSessionResult & {
      outcome: "registered";
    })
  | {
      outcome: "awaiting-approval";
      battleTag: string | null;
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
  returnTo: string | null;
};
