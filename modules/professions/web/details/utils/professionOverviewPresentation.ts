import type { ProfessionOverviewItem } from "../types/professionDetail.types";

export type ProfessionOverviewCategoryGroup = {
  category: string;
  categoryLabel: string;
  items: ProfessionOverviewItem[];
};

function getCategoryLabel(
  category: string
): string {
  switch (category) {
    case "CRAFTING":
      return "Crafting";

    case "GATHERING":
      return "Gathering";

    default:
      return (
        category
          .charAt(0)
          .toUpperCase() +
        category
          .slice(1)
          .toLowerCase()
      );
  }
}

/*
 * Groups the already-ordered overview list by category, preserving
 * both the item order within a category and the order categories are
 * first encountered (professions are already returned sorted by their
 * real "order" field, which puts Crafting professions before Gathering
 * ones - no category priority is hardcoded here).
 */
export function groupProfessionOverviewByCategory(
  items: ProfessionOverviewItem[]
): ProfessionOverviewCategoryGroup[] {
  const groupsByCategory =
    new Map<
      string,
      ProfessionOverviewCategoryGroup
    >();

  for (
    const item of
    items
  ) {
    const existing =
      groupsByCategory.get(
        item.category
      );

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groupsByCategory.set(
      item.category,
      {
        category: item.category,
        categoryLabel:
          getCategoryLabel(
            item.category
          ),
        items: [item]
      }
    );
  }

  return [
    ...groupsByCategory.values()
  ];
}

export type ProfessionOverviewRowPresentation = {
  isTracked: boolean;
  countsLine: string | null;
  attentionLine: string | null;
  updatedLine: string | null;
};

function formatCaptureDate(
  value: string
): string | null {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

/*
 * Compact, non-repetitive row content. A profession with zero assigned
 * characters (typical for Gathering, or a Crafting profession no one
 * has picked up yet) collapses to a single quiet "Not tracked" line -
 * per-character counts/timestamps would be meaningless there. For a
 * tracked profession, the attention line is the ONE thing genuinely
 * worth calling out - a capture that never happened, or characters
 * still missing specialization data - and is omitted entirely for a
 * healthy row, so "Captured"/"OK" never has to dominate every line.
 */
export function getProfessionOverviewRowPresentation(
  profession: ProfessionOverviewItem
): ProfessionOverviewRowPresentation {
  if (
    profession.characterCount === 0
  ) {
    return {
      isTracked: false,
      countsLine: null,
      attentionLine: null,
      updatedLine: null
    };
  }

  const countsLine =
    `${profession.characterCount} character${profession.characterCount === 1 ? "" : "s"} · ${profession.trackedCharacterCount} specialized`;

  const needsSpecializationCount =
    profession.characterCount -
    profession.trackedCharacterCount;

  let attentionLine: string | null =
    null;

  if (
    profession.captureStatus ===
    "NOT_CAPTURED"
  ) {
    attentionLine = "Import needed";
  }
  else if (
    needsSpecializationCount > 0
  ) {
    attentionLine =
      `${needsSpecializationCount} need${needsSpecializationCount === 1 ? "s" : ""} specialization`;
  }

  const updatedLine =
    profession.lastCapturedAt
      ? formatCaptureDate(
          profession.lastCapturedAt
        )
      : null;

  return {
    isTracked: true,
    countsLine,
    attentionLine,

    updatedLine:
      updatedLine
        ? `Updated ${updatedLine}`
        : null
  };
}
