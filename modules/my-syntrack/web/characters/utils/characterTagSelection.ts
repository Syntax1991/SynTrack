export type TagBulkState = "NONE" | "SOME" | "ALL";

/*
 * NONE/ALL map to an unambiguous single action (add to all / remove
 * from all); SOME is deliberately never auto-resolved into either -
 * the UI must offer both explicit actions rather than guess.
 */
export function computeBulkTagState(
  tagId: string,
  characterIds: Set<string>,
  tagIdsByCharacterId: Map<string, Set<string>>
): TagBulkState {
  if (characterIds.size === 0) {
    return "NONE";
  }

  let assignedCount = 0;

  for (const characterId of characterIds) {
    if (
      tagIdsByCharacterId
        .get(characterId)
        ?.has(tagId)
    ) {
      assignedCount += 1;
    }
  }

  if (assignedCount === 0) {
    return "NONE";
  }

  if (assignedCount === characterIds.size) {
    return "ALL";
  }

  return "SOME";
}
