/*
 * Guards the "return to where the user was" destination carried through
 * the Battle.net OAuth round trip. Must reject anything that could make
 * the post-login redirect leave SynTrack: a bare domain ("//evil.com" is
 * a protocol-relative URL), an absolute URL ("https://evil.com" or
 * "javascript:..."), or a backslash trick some browsers still treat as a
 * path separator ("/\evil.com"). Only a same-origin, single-leading-
 * slash path is accepted - everything else is dropped in favor of a safe
 * default by the caller.
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
