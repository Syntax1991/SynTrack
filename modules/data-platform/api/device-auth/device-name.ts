/*
 * The only place a client-supplied display name (e.g. "GAMING-PC") is
 * turned into what actually gets stored/rendered. Strips control/format
 * characters (including newlines - a name is a single line, never a
 * multi-line payload) and collapses runs of whitespace, so the Devices
 * management UI can render it as plain text without it carrying anything
 * that could break layout or masquerade as a different string. This is a
 * defense-in-depth measure - React already escapes text content, but the
 * spec explicitly calls for the name itself to be sanitized, not just
 * safely rendered.
 */
const maxDeviceNameLength = 80;

const controlCharacterPattern = new RegExp(
  "[\\u0000-\\u001F\\u007F-\\u009F]",
  "gu"
);

const whitespaceRunPattern = new RegExp(
  "\\s+",
  "gu"
);

export function sanitizeDeviceName(
  raw: string | null | undefined
): string | null {
  if (!raw) {
    return null;
  }

  const stripped = raw
    .replace(controlCharacterPattern, " ")
    .replace(whitespaceRunPattern, " ")
    .trim();

  if (!stripped) {
    return null;
  }

  return stripped.slice(0, maxDeviceNameLength);
}
