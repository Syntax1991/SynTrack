import type { BattleNetTokenResponse } from "./battlenet.types.js";

/*
 * Stateless response-decoding helpers shared by every BattleNetClient
 * method - split out to stay under the 350-line architecture cap.
 */
export async function readJsonResponse(
  response: Response
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  }
  catch {
    return {
      response: text.slice(0, 500)
    };
  }
}

export function isTokenResponse(
  payload: unknown
): payload is BattleNetTokenResponse {
  if (
    typeof payload !== "object" ||
    payload === null
  ) {
    return false;
  }

  const candidate =
    payload as Record<string, unknown>;

  return (
    typeof candidate.access_token ===
      "string" &&
    typeof candidate.token_type ===
      "string"
  );
}
