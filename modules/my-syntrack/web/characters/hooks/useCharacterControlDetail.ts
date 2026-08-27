import { useEffect, useState } from "react";
import { getCharacterControlDetail } from "../api/characterControlApi";
import type { CharacterControlDetailResponse } from "../types/characterControlDetail.types";

const notFoundMessage = "Character not found.";

type CharacterControlDetailState = {
  detail: CharacterControlDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
};

export function useCharacterControlDetail(
  characterId: string | undefined
): CharacterControlDetailState {
  const [detail, setDetail] =
    useState<CharacterControlDetailResponse | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(Boolean(characterId));

  const [error, setError] =
    useState<string | null>(null);

  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    if (!characterId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const response =
          await getCharacterControlDetail(
            characterId as string
          );

        if (!cancelled) {
          setDetail(response);
        }
      }
      catch (loadError) {
        if (cancelled) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Character could not be loaded.";

        if (
          message === notFoundMessage
        ) {
          setNotFound(true);
        }
        else {
          setError(message);
        }
      }
      finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  return {
    detail,
    isLoading,
    error,
    notFound
  };
}
