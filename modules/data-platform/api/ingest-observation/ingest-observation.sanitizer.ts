/*
 * Defense-in-depth only: every real caller passes a decoded provider
 * response body (Blizzard JSON) or a raw addon domain slice (Lua
 * table), never a request/header object, so none of these keys should
 * ever genuinely appear. This exists purely as a safety net against an
 * unexpected/pathological provider payload - it must never rename or
 * transform ordinary game data.
 */
const SECRET_KEY_PATTERN =
  /(authoriz|bearer|access[_-]?token|refresh[_-]?token|client[_-]?secret|cookie|session|password|api[_-]?key)/i;

const REDACTED = "[REDACTED]";

export function sanitizeIngestPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeIngestPayload);
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(source)) {
      result[key] = SECRET_KEY_PATTERN.test(key)
        ? REDACTED
        : sanitizeIngestPayload(source[key]);
    }

    return result;
  }

  return value;
}
