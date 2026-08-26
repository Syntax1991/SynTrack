import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type {
  ProfessionCharacterCoverage,
  ProfessionDetail
} from "../types/professionDetail.types";
import { ProfessionOverviewResponsibilityTable } from "./ProfessionOverviewResponsibilityTable";

export function createClaim(
  overrides: Partial<
    ProfessionCharacterCoverage["specializationEquipment"][number]
  >
): ProfessionCharacterCoverage["specializationEquipment"][number] {
  const familyName =
    overrides.familyName ?? "Leather";
  const slotKey =
    overrides.slotKey ?? "WRIST";

  return {
    id: "claim",
    provenance: "CURATED_VERIFIED",
    kind: "EQUIPMENT_SLOT",
    capabilityKey: `${familyName}:${slotKey}`,
    presentationGroup: familyName,
    familyName,
    slotKey,
    slotName: "Wrist",
    rank: 20,
    maxRank: 20,
    nodeName: "Wonderful Wristguards",
    nodeKey: "addon:107884",
    nodeIconUrl: null,
    ...overrides
  };
}

/*
 * The Overview renderer reads explicitSlotNodeRanks (one row per curated
 * slot), not specializationEquipment directly - but every test in this
 * suite was written against createClaim's ProfessionSpecializationEquipmentClaim
 * shape, which carries every field an ExplicitSlotNodeRank needs. Rather
 * than rewrite every call site, derive explicitSlotNodeRanks from
 * specializationEquipment automatically whenever the former isn't given
 * explicitly - the two are already meant to describe the same underlying
 * claims in this codebase's real mappers.
 */
export function createCoverage(
  overrides: Partial<ProfessionCharacterCoverage> & {
    character: ProfessionCharacterCoverage["character"];
  }
): ProfessionCharacterCoverage {
  const specializationEquipment =
    overrides.specializationEquipment ?? [];

  const derivedExplicitSlotNodeRanks =
    specializationEquipment.map(
      (claim) => ({
        capabilityKey: claim.capabilityKey,
        presentationGroup: claim.presentationGroup,
        familyName: claim.familyName,
        slotKey: claim.slotKey,
        slotName: claim.slotName,
        nodeKey: claim.nodeKey,
        nodeName: claim.nodeName,
        nodeIconUrl: claim.nodeIconUrl,
        rank: claim.rank,
        maxRank: claim.maxRank
      })
    );

  return {
    characterProfessionId:
      `assignment-${overrides.character.id}`,
    skill: 100,
    knowledgePoints: 20,
    dataStatus: "TRACKED",
    craftableEquipment: [],
    specializationEquipment,
    generalSpecialization: [],
    explicitSlotNodeRanks:
      derivedExplicitSlotNodeRanks,
    slotSpecializationNodes: [],
    recipes: [],
    capabilities: [],
    ...overrides
  };
}

export function createDetail(
  characters: ProfessionCharacterCoverage[]
): ProfessionDetail {
  return {
    profession: {
      id: "profession-1",
      key: "leatherworking",
      name: "Leatherworking",
      category: "CRAFTING"
    },
    specializationMappingAvailable: true,
    summary: {
      characterCount:
        characters.length,
      trackedCharacterCount:
        characters.length,
      missingCharacterCount: 0,
      craftableEquipmentCount: 0,
      catalogRecipeCount: 0,
      learnedRecipeCount: 0,
      catalogCapabilityCount: 0,
      coveredCapabilityCount: 0
    },
    characters
  };
}

export function renderTable(
  detail: ProfessionDetail,
  onNavigateToFindCraft?: (
    familyName: string,
    slotKey: string
  ) => void
) {
  return render(
    <MemoryRouter>
      <ProfessionOverviewResponsibilityTable
        detail={detail}
        onNavigateToFindCraft={
          onNavigateToFindCraft
        }
      />
    </MemoryRouter>
  );
}
