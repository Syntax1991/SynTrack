/*
 * Maps the short, stable `error` query-param code the backend redirects
 * with (see raider-auth.controller.ts#errorRedirect) to user-facing copy.
 * Shared by LoginPage and RegisterPage so both surfaces describe the same
 * failure the same way. "state_expired" is deliberately distinct from the
 * generic fallback: it means the OAuth round trip itself was too old/
 * already used/unrecognized by the time the callback arrived (see
 * BattleNetRepository.consumeOAuthState), which is a different, more
 * specific situation than an actual Battle.net-side sign-in failure - the
 * fix is the same either way (start over), but telling the user
 * accurately what happened avoids implying their Battle.net credentials
 * were the problem when they weren't.
 */
export type AuthErrorCopy = {
  title: string;
  description: string;
};

export function getAuthErrorCopy(
  errorCode: string | null
): AuthErrorCopy | null {
  if (!errorCode) {
    return null;
  }

  if (errorCode === "state_expired") {
    return {
      title: "Sign-in expired",
      description:
        "Battle.net sign-in expired or could not be verified. This can happen if the sign-in page was left open too long, or the link was opened more than once."
    };
  }

  return {
    title: "Sign-in failed",
    description:
      "Could not sign in with Battle.net."
  };
}
