/*
 * Client-side mirror of the server-side guard in
 * modules/data-platform/api/raider-auth/internal-path.ts. The server is
 * the actual authority (it re-validates whatever it stores on the OAuth
 * state row), but the frontend applies the same rule before ever putting
 * a "returnTo" value into a link or navigate() call, so an unsafe value
 * never even leaves the browser.
 */
export function isSafeInternalPath(
  path: string | null | undefined
): path is string {
  if (!path) {
    return false;
  }

  if (!path.startsWith("/")) {
    return false;
  }

  if (
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return false;
  }

  if (path.includes("://")) {
    return false;
  }

  return true;
}
