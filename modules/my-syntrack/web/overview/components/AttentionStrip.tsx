import { useState } from "react";
import { Link } from "react-router-dom";
import type { AttentionItem } from "../types/overview.types";

const previewCount = 3;

/*
 * Replaces the old large "Needs attention" panel - the matrix's Next
 * Action column is the canonical per-character surface for this, so
 * this strip is a single collapsed line by default, not a duplicate of
 * every row above the same characters.
 */
export function AttentionStrip({
  attentionItems
}: {
  attentionItems: AttentionItem[];
}) {
  const [expanded, setExpanded] =
    useState(false);

  if (attentionItems.length === 0) {
    return (
      <div className="overview-attention-strip overview-attention-strip-clear">
        Nothing needs attention right
        now.
      </div>
    );
  }

  const characterCount = new Set(
    attentionItems.map(
      (item) => item.characterId
    )
  ).size;

  const preview = attentionItems
    .slice(0, previewCount)
    .map(
      (item) =>
        `${item.characterName}: ${item.label}`
    )
    .join(" · ");

  const remaining =
    attentionItems.length -
    Math.min(
      previewCount,
      attentionItems.length
    );

  return (
    <div className="overview-attention-strip">
      <button
        aria-expanded={expanded}
        className="overview-attention-strip-toggle"
        onClick={() =>
          setExpanded(!expanded)
        }
        type="button"
      >
        <span aria-hidden="true">
          ⚠
        </span>{" "}
        {characterCount}{" "}
        {characterCount === 1
          ? "character"
          : "characters"}{" "}
        need attention — {preview}
        {remaining > 0 &&
          ` · +${remaining} more`}
      </button>

      {expanded && (
        <ul className="overview-attention-strip-list">
          {attentionItems.map(
            (item) => (
              <li key={item.id}>
                <Link to={item.path}>
                  <strong>
                    {
                      item.characterName
                    }
                  </strong>
                  : {item.label}
                  {item.detail &&
                    ` (${item.detail})`}
                </Link>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
