import type { ProfessionCharacterCoverage } from "../types/professionDetail.types";
import type { BrowseCandidate } from "./professionFindCraftBrowse.helpers";
import { ProfessionFindCraftBrowseCandidateRow } from "./ProfessionFindCraftBrowseCandidateRow";

type ProfessionFindCraftBrowseCandidateListProps = {
  candidates: BrowseCandidate[];
  coverageByCharacterId: Map<
    string,
    ProfessionCharacterCoverage
  >;
  specializationMappingAvailable: boolean;
  slotContext: {
    familyName: string;
    slotKey: string;
  } | null;
};

export function ProfessionFindCraftBrowseCandidateList({
  candidates,
  coverageByCharacterId,
  specializationMappingAvailable,
  slotContext
}: ProfessionFindCraftBrowseCandidateListProps) {
  if (candidates.length === 0) {
    return (
      <div className="empty-state">
        No captured character knows
        a matching recipe yet.
      </div>
    );
  }

  return (
    <div className="profession-find-craft-browse-candidates">
      {candidates.map(
        (candidate) => (
          <ProfessionFindCraftBrowseCandidateRow
            candidate={candidate}
            coverage={
              coverageByCharacterId.get(
                candidate.characterId
              )
            }
            key={
              candidate.characterId
            }
            specializationEquipment={
              coverageByCharacterId.get(
                candidate.characterId
              )
                ?.specializationEquipment ??
                []
            }
            specializationMappingAvailable={
              specializationMappingAvailable
            }
            slotContext={
              slotContext
            }
          />
        )
      )}
    </div>
  );
}
