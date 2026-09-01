/*
 * CharacterProfession.knowledgePoints is persisted from addon
 * expansion.investedKnowledge (see addon-import.profession.persistence.ts),
 * which normalizes C_Traits currency.spent via normalizeKnowledgeSpent().
 *
 * Free/unspent Knowledge is captured separately as expansion.knowledge.available
 * from C_ProfSpecs.GetCurrencyInfoForSkillLine().numAvailable in
 * Specializations.lua, but is NOT persisted on CharacterProfession today.
 */
export type ProfessionInvestedKnowledge = {
  meaning: "INVESTED";
  invested: number;
  display: string;
};

export function resolveInvestedKnowledgeDisplay(
  investedKnowledge: number
): ProfessionInvestedKnowledge {
  return {
    meaning: "INVESTED",
    invested: investedKnowledge,
    display: String(investedKnowledge)
  };
}
