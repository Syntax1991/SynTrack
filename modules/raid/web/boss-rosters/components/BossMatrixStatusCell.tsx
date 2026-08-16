import { useState } from "react";
import { getSpecById } from "../../../shared/catalog/raidSpecializationCatalog";
import type { RaidBossRosterStatus } from "../types/bossRoster.types";
import { SpecPickerPopover } from "./SpecPickerPopover";

const cellLabel: Record<
  RaidBossRosterStatus,
  string
> = {
  CONFIRMED: "✓",
  TENTATIVE: "?",
  BENCH: "B"
};

const cellBarClass: Record<
  RaidBossRosterStatus,
  string
> = {
  CONFIRMED:
    "boss-matrix-bar confirmed",
  TENTATIVE:
    "boss-matrix-bar tentative",
  BENCH: "boss-matrix-bar bench"
};

type BossMatrixStatusCellProps = {
  displayStatus:
    | RaidBossRosterStatus
    | null;
  isSuggested: boolean;
  isEntrySaved: boolean;
  className: string;
  specId: number | null;
  onClick: () => void;
  onSetSpec: (
    specId: number | null
  ) => void;
};

/**
 * The status bar keeps its existing click-to-cycle behavior; the real
 * spec identity is a small icon badge in the corner, only shown once
 * an entry actually exists (a spec describes an existing lineup
 * participation, not a hypothetical one). Clicking the badge opens
 * the compact SpecPickerPopover instead of cycling status —
 * stopPropagation keeps the two interactions from colliding.
 */
export function BossMatrixStatusCell({
  displayStatus,
  isSuggested,
  isEntrySaved,
  className,
  specId,
  onClick,
  onSetSpec
}: BossMatrixStatusCellProps) {
  const [isPickerOpen, setIsPickerOpen] =
    useState(false);

  const spec = getSpecById(specId);

  return (
    <td
      className="boss-matrix-cell"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div
        className={
          displayStatus
            ? `${cellBarClass[displayStatus]}${isSuggested ? " suggested" : ""}`
            : "boss-matrix-bar empty"
        }
        title={
          isSuggested
            ? "Signed up present - not yet confirmed for this boss"
            : undefined
        }
      >
        {displayStatus
          ? cellLabel[displayStatus]
          : ""}
      </div>

      {isEntrySaved && (
        <button
          aria-label={
            spec
              ? `${spec.name} — click to change specialization`
              : "Set specialization"
          }
          className="boss-matrix-spec-badge"
          onClick={(event) => {
            event.stopPropagation();
            setIsPickerOpen((current) => !current);
          }}
          title={
            spec
              ? `${spec.name} · ${spec.role}`
              : "Specialization unknown — click to set"
          }
          type="button"
        >
          {spec ? (
            <img alt="" src={spec.icon} />
          ) : (
            <span className="boss-matrix-spec-badge-empty" />
          )}
        </button>
      )}

      {isPickerOpen && (
        <SpecPickerPopover
          className={className}
          currentSpecId={specId}
          onClose={() =>
            setIsPickerOpen(false)
          }
          onSelect={onSetSpec}
        />
      )}
    </td>
  );
}
