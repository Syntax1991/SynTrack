import type {
  ProfessionKnowledgeTreasureAggregate,
  CharacterProfessionKnowledgeTreasureStatus
} from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import type {
  AttentionItem,
  CharacterProfessionSummary,
  OverviewDomainState
} from "./overview.types.js";
import type {
  ProfessionSetupOverviewState,
  ProfessionSetupProfessionSummary
} from "./overview-triage.types.js";
import type { OverviewProfessionCharacterInput } from "./overview-profession-state.mapper.js";

export type OverviewProfessionSetupInput = {
  profession: OverviewProfessionCharacterInput;
  treasures: CharacterProfessionKnowledgeTreasureStatus;
};

/*
 * Overview PROF. = permanent profession setup / readiness, NOT weekly
 * Quest/Treatise/Drops. Combines profession data-health with one-time
 * Knowledge Treasure completion. A character can be PROF ✓ while
 * WEEKLIES ! when only a Treatise remains.
 */
export function resolveProfessionSetupOverviewState(
  input: OverviewProfessionSetupInput
): {
  professionSetup: ProfessionSetupOverviewState;
  attentionItem: AttentionItem | null;
} {
  const { profession, treasures } = input;

  const treasureByKey = new Map(
    treasures.professions.map((entry) => [
      entry.professionKey,
      entry
    ])
  );

  const professionKeys = new Set([
    ...profession.professions.map((item) => item.key),
    ...treasures.professions.map((entry) => entry.professionKey)
  ]);

  const professions: ProfessionSetupProfessionSummary[] = [
    ...professionKeys
  ].map((key) => {
    const item = profession.professions.find(
      (candidate) => candidate.key === key
    );
    const treasure = treasureByKey.get(key);
    const treasureAggregate: ProfessionKnowledgeTreasureAggregate =
      treasure?.treasures ?? {
        completeCount: 0,
        incompleteCount: 0,
        unknownCount: 0,
        applicableTotal: 0
      };

    return {
      professionId: item?.professionId ?? key,
      key,
      name: item?.name ?? treasure?.name ?? key,
      dataStatus: item?.dataStatus ?? "UNTRACKED",
      treasures: treasureAggregate
    };
  });

  const hasActiveProfession =
    profession.hasTrackedProfession ||
    professions.length > 0 ||
    treasures.treasures.applicableTotal > 0;


  const hasDataIssue =
    profession.partialProfessionIssues.length > 0;

  const hasTreasureIncomplete =
    treasures.treasures.incompleteCount > 0;

  const hasTreasureUnknown =
    treasures.treasures.unknownCount > 0 &&
    treasures.treasures.applicableTotal > 0;

  const state: OverviewDomainState = !hasActiveProfession
    ? "NOT_TRACKED"
    : hasDataIssue || hasTreasureIncomplete
      ? "ATTENTION"
      : hasTreasureUnknown ||
          professions.some(
            (entry) =>
              entry.dataStatus === "UNTRACKED" ||
              entry.dataStatus === "NO_CATALOG"
          )
        ? "UNKNOWN"
        : "READY";

  const professionSetup: ProfessionSetupOverviewState = {
    state,
    professions,
    dataIssues: profession.partialProfessionIssues
  };

  if (state !== "ATTENTION") {
    return { professionSetup, attentionItem: null };
  }

  if (hasTreasureIncomplete) {
    const missing = treasures.professions
      .map((entry) => {
        const count = entry.sources.filter(
          (source) => source.state === "INCOMPLETE"
        ).length;
        return { name: entry.name, count };
      })
      .filter((entry) => entry.count > 0);

    const label =
      missing.length === 1
        ? `${missing[0]!.count} ${missing[0]!.name} Knowledge Treasure${
            missing[0]!.count === 1 ? "" : "s"
          } missing`
        : `${missing.reduce((sum, entry) => sum + entry.count, 0)} profession knowledge treasures missing`;

    return {
      professionSetup,
      attentionItem: {
        id: `${profession.id}:profession-setup`,
        characterId: profession.id,
        characterName: profession.name,
        domain: "profession",
        severity: "this-week",
        label,
        detail: missing
          .map((entry) => `${entry.name} (${entry.count} missing)`)
          .join(", "),
        path: `/characters/${profession.id}`
      }
    };
  }

  const partialProfessionId =
    profession.professions.find(
      (entry: CharacterProfessionSummary) =>
        entry.dataStatus === "PARTIAL"
    )?.professionId ?? null;

  return {
    professionSetup,
    attentionItem: {
      id: `${profession.id}:profession-setup`,
      characterId: profession.id,
      characterName: profession.name,
      domain: "profession",
      severity: "this-week",
      label: "Profession data incomplete",
      detail: profession.partialProfessionIssues[0] ?? null,
      path:
        `/professions/specializations?character=${encodeURIComponent(profession.id)}` +
        (partialProfessionId
          ? `&profession=${encodeURIComponent(partialProfessionId)}`
          : "")
    }
  };
}
