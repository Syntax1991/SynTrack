import type { ImportableBattleNetCharacter } from "../integrations/battlenet/battlenet-import.mapper.js";

export type RaiderAuthIntent = "login" | "register";

export type RaiderSessionResult = {
  token: string;
  raiderAccountId: string;
  characters: ImportableBattleNetCharacter[];
};

export type RaiderSessionGuard = {
  requireSession(
    token: string
  ): Promise<RaiderSessionResult>;
};

export type RaiderAccessTokenGuard = {
  requireUsableAccessToken(
    token: string
  ): Promise<{
    accessToken: string;
  }>;
};

export type RaiderSessionStatus = {
  battleTag: string | null;
  expiresAt: string;
};

/*
 * Every branch a Battle.net OAuth callback can resolve to, once intent
 * (login vs register, recorded server-side on the OAuth state row) and
 * whether a SynTrack account already owns the canonical Battle.net
 * identity are both known. No branch here creates a RaiderAccount as a
 * side effect of OAuth alone - "register-pending" is the only new-account
 * path, and it requires a separate explicit confirm call
 * (RaiderAuthService.confirmRegistration) to actually create anything.
 */
export type RaiderAuthCallbackOutcome =
  | {
      outcome: "login-success";
      token: string;
      returnTo: string | null;
    }
  | {
      outcome: "login-unknown-account";
    }
  | {
      outcome: "register-existing-account";
      token: string;
    }
  | {
      outcome: "register-pending";
      pendingToken: string;
    }
  | {
      outcome: "error";
      intent: RaiderAuthIntent;
      message: string;
    };

export type RaiderPendingRegistrationInfo = {
  battleTag: string | null;
};
