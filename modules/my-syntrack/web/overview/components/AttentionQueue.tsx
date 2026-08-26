import { useState } from "react";
import { Link } from "react-router-dom";
import type {
  AttentionDomain,
  AttentionItem
} from "../types/overview.types";

const domainLabel: Record<
  AttentionDomain,
  string
> = {
  weekly: "Weeklies",
  vault: "Vault",
  profession: "Professions",
  gear: "Gear"
};

const initialVisibleCount = 6;

export function AttentionQueue({
  attentionItems
}: {
  attentionItems: AttentionItem[];
}) {
  const [showAll, setShowAll] =
    useState(false);

  if (attentionItems.length === 0) {
    return (
      <section className="panel overview-attention-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">
              NEXT ACTIONS
            </p>

            <h2>
              Needs attention
            </h2>
          </div>
        </div>

        <div className="empty-state">
          Nothing needs attention
          right now.
        </div>
      </section>
    );
  }

  const visibleItems = showAll
    ? attentionItems
    : attentionItems.slice(
        0,
        initialVisibleCount
      );

  const hiddenCount =
    attentionItems.length -
    visibleItems.length;

  return (
    <section className="panel overview-attention-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            NEXT ACTIONS
          </p>

          <h2>Needs attention</h2>
        </div>

        <span className="overview-attention-count">
          {attentionItems.length}
        </span>
      </div>

      <div className="overview-attention-list">
        {visibleItems.map((item) => (
          <Link
            className="overview-attention-item"
            key={item.id}
            to={item.path}
          >
            <span className="overview-attention-character">
              {item.characterName}
            </span>

            <span className="overview-attention-domain">
              {
                domainLabel[
                  item.domain
                ]
              }
            </span>

            <span className="overview-attention-copy">
              <strong>
                {item.label}
              </strong>

              {item.detail && (
                <small>
                  {item.detail}
                </small>
              )}
            </span>

            <span
              aria-hidden="true"
              className="overview-attention-arrow"
            >
              →
            </span>
          </Link>
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          className="text-button overview-attention-toggle"
          onClick={() =>
            setShowAll(true)
          }
          type="button"
        >
          Show {hiddenCount} more
        </button>
      )}
    </section>
  );
}
