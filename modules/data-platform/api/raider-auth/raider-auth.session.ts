import { randomBytes } from "node:crypto";
import type { RaiderAuthRepository } from "./raider-auth.repository.js";

export const raiderSessionLifetimeMilliseconds =
  30 * 24 * 60 * 60 * 1000;

/*
 * Shared by both the login/register-existing-account path
 * (raider-auth-callback.resolver.ts) and confirmRegistration
 * (raider-auth-callback.service.ts) - the only two places a
 * RaiderSession is ever minted.
 */
export async function issueRaiderSession(
  repository: RaiderAuthRepository,
  raiderAccountId: string,
  characters: unknown
): Promise<string> {
  const sessionToken =
    randomBytes(32).toString("hex");

  await repository.createSession({
    token: sessionToken,
    raiderAccountId,
    charactersJson: JSON.stringify(
      characters
    ),
    expiresAt: new Date(
      Date.now() +
        raiderSessionLifetimeMilliseconds
    )
  });

  return sessionToken;
}
