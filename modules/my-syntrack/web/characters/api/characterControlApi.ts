import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type { CharacterControlDetailResponse } from "../types/characterControlDetail.types";

export function getCharacterControlDetail(
  characterId: string
): Promise<CharacterControlDetailResponse> {
  return apiRequest<CharacterControlDetailResponse>(
    `/overview/characters/${encodeURIComponent(characterId)}`
  );
}
