import type {
  ProfessionCrafterRecipeEntry
} from "./ProfessionCrafterRecipeTable";

/*
 * These describe the CRAFT RESULT of the quality simulation only (can
 * the recipe reach its top quality tier, and does that require spending
 * Concentration currency) - they are not an overall verdict on whether
 * this character is the right crafter, which also depends on
 * Specialization alignment shown in its own column.
 */
export function getStatusLabel(
  entry:
    ProfessionCrafterRecipeEntry
): string {
  switch (
    entry.crafter.craftStatus
  ) {
    case "SAFE":
      return "No Concentration";

    case "CONCENTRATION":
      return "Needs Concentration";

    case "NOT_SAFE":
      return "Cannot Reach";

    case "UNKNOWN":
      return "Unknown";
  }
}

/*
 * A single compact cell combining quality + concentration cost, for the
 * default table row. Example outputs: "Q5", "Q5 · 222 Conc", "Cannot
 * reach Q5", "Unknown". Full status wording and exact skill/material
 * numbers stay in the expandable row detail.
 */
export function getCompactCraftLabel(
  entry:
    ProfessionCrafterRecipeEntry
): string {
  const {
    craftStatus,
    recommendation
  } = entry.crafter;

  const quality =
    recommendation.craftingQuality;

  switch (craftStatus) {
    case "SAFE":
      return quality !== null
        ? `Q${quality}`
        : "No Concentration";

    case "CONCENTRATION":
      if (quality === null) {
        return "Needs Concentration";
      }

      return (
        recommendation
          .concentrationCost !== null
          ? `Q${quality} · ${recommendation.concentrationCost} Conc`
          : `Q${quality} · Conc`
      );

    case "NOT_SAFE":
      return quality !== null
        ? `Cannot reach Q${quality}`
        : "Cannot Reach";

    case "UNKNOWN":
      return "Unknown";
  }
}

export function getResultLabel(
  entry:
    ProfessionCrafterRecipeEntry
): string {
  const recommendation =
    entry.crafter
      .recommendation;

  const parts: string[] =
    [];

  if (
    recommendation
      .craftingQuality !==
    null
  ) {
    parts.push(
      `Q${recommendation.craftingQuality}`
    );
  }

  if (
    recommendation
      .effectiveSkill !==
    null
  ) {
    parts.push(
      `Skill ${recommendation.effectiveSkill}`
    );
  }

  return parts.length > 0
    ? parts.join(" · ")
    : "–";
}

export function getSpecializationClassName(
  state:
    "SPECIALIZED" |
    "NOT_SPECIALIZED" |
    "UNKNOWN" |
    "NOT_APPLICABLE"
): string {
  switch (state) {
    case "SPECIALIZED":
      return (
        "profession-crafter-specialization specialized"
      );

    case "NOT_SPECIALIZED":
      return (
        "profession-crafter-specialization not-specialized"
      );

    case "UNKNOWN":
      return (
        "profession-crafter-specialization unknown"
      );

    case "NOT_APPLICABLE":
      return (
        "profession-crafter-specialization not-applicable"
      );
  }
}

export function sortEntries(
  entries:
    ProfessionCrafterRecipeEntry[]
): ProfessionCrafterRecipeEntry[] {
  return [...entries].sort(
    (left, right) =>
      left.group.localeCompare(
        right.group,
        "en"
      ) ||
      left.recipe.name.localeCompare(
        right.recipe.name,
        "en"
      )
  );
}
