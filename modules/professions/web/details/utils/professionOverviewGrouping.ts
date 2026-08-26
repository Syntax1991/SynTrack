import type {
  ProfessionCharacterCoverage
} from "../types/professionDetail.types";

export type OverviewSlotRow = {
  id: string;
  slotName: string;
  slotKey: string;
  familyName: string;
  nodeName: string;
  nodeKey: string;
  nodeIconUrl: string | null;
  rank: number;
  maxRank: number | null;
};

export type OverviewCharacterGroup = {
  characterId: string;
  characterName: string;
  characterClassName: string;
  rows: OverviewSlotRow[];
};

export type OverviewFamilyGroup = {
  presentationGroup: string;
  characterGroups: OverviewCharacterGroup[];
};

/*
 * Overview's "who is responsible for what", grouped PRESENTATION GROUP ->
 * CHARACTER -> ONE ROW PER SLOT - never combining two distinct
 * responsibilities (e.g. Chest and Legs, or Axe and Polearm) onto a
 * single line just because the same node currently backs both. Sourced
 * directly from explicitSlotNodeRanks - the same always-one-row-per-
 * curated-(family,slot)-pair data the Specializations tab already uses -
 * filtered to real, proven investment (rank > 0) since Overview shows
 * proven responsibility only, never the full 0/max tree (that remains
 * the Specializations tab's job).
 *
 * The resolved nodeName for a row is whatever real node the existing
 * specific-over-bundle logic already determined earns that slot -
 * "Chestplates" if a character specifically invested there, or
 * "Large Plate Armor" if only the bundle covers it. Two rows may
 * legitimately show the same nodeName (e.g. Chest and Legs both showing
 * "Large Plate Armor" for a character who only has the bundle) - that is
 * not a bug, it is the same bundle genuinely covering two real,
 * separately-tracked slots, and each still needs its own row so a reader
 * can see both concrete responsibilities rather than one merged line.
 *
 * presentationGroup defaults to familyName (so Leatherworking still
 * splits into Leather/Mail sections), but a profession can explicitly
 * group multiple distinct families under one shared heading - e.g.
 * Blacksmithing's Plate and Shield claims both carry presentationGroup:
 * "Armor" (see profession-specialization-equipment.blacksmithing
 * .definitions.ts on the backend) so they render as one "Armor" section
 * here, even though familyName stays genuinely different underneath. A
 * character contributes a group under a presentation group only if they
 * have at least one proven row there; the same character can legitimately
 * appear under both Leather and Mail if invested in both. Rows are
 * ordered by slot name - a stable, neutral order that carries no implied
 * importance.
 */
export function buildOverviewFamilyGroups(
  characters:
    ProfessionCharacterCoverage[]
): OverviewFamilyGroup[] {
  const characterGroupsByPresentationGroup =
    new Map<
      string,
      Map<
        string,
        OverviewCharacterGroup
      >
    >();

  for (
    const coverage of
    characters
  ) {
    const rowsByPresentationGroup =
      new Map<
        string,
        OverviewSlotRow[]
      >();

    for (
      const entry of
      coverage.explicitSlotNodeRanks
    ) {
      if (entry.rank <= 0) {
        continue;
      }

      const existing =
        rowsByPresentationGroup.get(
          entry.presentationGroup
        ) ?? [];

      existing.push({
        id:
          `${coverage.characterProfessionId}:${entry.capabilityKey}`,
        slotName:
          entry.slotName,
        slotKey:
          entry.slotKey,
        familyName:
          entry.familyName,
        nodeName:
          entry.nodeName,
        nodeKey:
          entry.nodeKey,
        nodeIconUrl:
          entry.nodeIconUrl,
        rank:
          entry.rank,
        maxRank:
          entry.maxRank
      });

      rowsByPresentationGroup.set(
        entry.presentationGroup,
        existing
      );
    }

    for (
      const [
        presentationGroup,
        rows
      ] of rowsByPresentationGroup
    ) {
      const byCharacter =
        characterGroupsByPresentationGroup.get(
          presentationGroup
        ) ??
        new Map<
          string,
          OverviewCharacterGroup
        >();

      byCharacter.set(
        coverage.character.id,
        {
          characterId:
            coverage.character.id,
          characterName:
            coverage.character
              .name,
          characterClassName:
            coverage.character
              .className,
          rows: rows.sort(
            (left, right) =>
              left.slotName.localeCompare(
                right.slotName,
                "en"
              )
          )
        }
      );

      characterGroupsByPresentationGroup.set(
        presentationGroup,
        byCharacter
      );
    }
  }

  return [
    ...characterGroupsByPresentationGroup.entries()
  ]
    .map(
      ([
        presentationGroup,
        byCharacter
      ]) => ({
        presentationGroup,
        characterGroups: [
          ...byCharacter.values()
        ].sort(
          (left, right) =>
            left.characterName.localeCompare(
              right.characterName,
              "en"
            )
        )
      })
    )
    .sort(
      (left, right) =>
        left.presentationGroup.localeCompare(
          right.presentationGroup,
          "en"
        )
    );
}

export type OverviewGeneralGroup = {
  characterId: string;
  characterName: string;
  characterClassName: string;
  entries:
    ProfessionCharacterCoverage["generalSpecialization"];
};

/*
 * The General/Profession section: a character's overall tree
 * investment (e.g. "Flawless Fortes 30/30"), independent of whether
 * they have any Leather/Mail EQUIPMENT specialization at all. This is
 * what keeps a character like Synbomb from being represented as
 * globally unspecialized - he simply contributes nothing to
 * buildOverviewFamilyGroups above, but still appears here with his real
 * general investment.
 */
export function buildOverviewGeneralGroups(
  characters:
    ProfessionCharacterCoverage[]
): OverviewGeneralGroup[] {
  return characters
    .filter(
      (coverage) =>
        coverage.generalSpecialization
          .length > 0
    )
    .map(
      (coverage) => ({
        characterId:
          coverage.character.id,
        characterName:
          coverage.character.name,
        characterClassName:
          coverage.character
            .className,
        entries:
          coverage.generalSpecialization
      })
    )
    .sort(
      (left, right) =>
        left.characterName.localeCompare(
          right.characterName,
          "en"
        )
    );
}
