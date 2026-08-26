import { useState } from "react";
import type { ProfessionDetail } from "../types/professionDetail.types";
import { useFindCraftQualityFilter } from "../hooks/useFindCraftQualityFilter";
import { ProfessionCrafterWorkspace } from "./ProfessionCrafterWorkspace";
import { ProfessionFindCraftByRecipe } from "./ProfessionFindCraftByRecipe";
import { ProfessionFindCraftBrowse } from "./ProfessionFindCraftBrowse";
import { ProfessionItemQualityFilterControl } from "./ProfessionItemQualityFilterControl";

export type ProfessionFindCraftDeepLink = {
  familyName: string;
  slotKey: string;
  nonce: number;
};

type ProfessionFindCraftWorkspaceProps = {
  detail: ProfessionDetail;
  professionId: string;
  deepLink?: ProfessionFindCraftDeepLink | null;
};

type FindCraftMode =
  | "browse"
  | "search"
  | "character";

/*
 * "I need Mail Wrist" (browse by category/slot) is the default - most
 * users know the TYPE of item they need, not the exact recipe name.
 * Search remains a shortcut for when the exact name is already known.
 * By Character answers the opposite question ("what can Synblast
 * make?") and stays secondary.
 */
export function ProfessionFindCraftWorkspace({
  detail,
  professionId,
  deepLink
}: ProfessionFindCraftWorkspaceProps) {
  const [
    mode,
    setMode
  ] =
    useState<FindCraftMode>(
      "browse"
    );

  const [
    qualityFilter,
    setQualityFilter
  ] =
    useFindCraftQualityFilter();

  return (
    <section
      className="profession-find-craft-workspace"
      key={
        deepLink
          ? deepLink.nonce
          : "default"
      }
    >
      <div className="profession-find-craft-mode-toggle">
        <button
          className={
            mode === "browse"
              ? "active"
              : ""
          }
          onClick={
            () => setMode("browse")
          }
          type="button"
        >
          Browse
        </button>

        <button
          className={
            mode === "search"
              ? "active"
              : ""
          }
          onClick={
            () => setMode("search")
          }
          type="button"
        >
          Search
        </button>

        <button
          className={
            mode === "character"
              ? "active"
              : ""
          }
          onClick={
            () =>
              setMode("character")
          }
          type="button"
        >
          By Character
        </button>
      </div>

      <ProfessionItemQualityFilterControl
        onChange={setQualityFilter}
        value={qualityFilter}
      />

      {mode === "browse" && (
        <ProfessionFindCraftBrowse
          detail={detail}
          initialFamilyName={
            deepLink?.familyName ??
            null
          }
          initialSlotKey={
            deepLink?.slotKey ??
            null
          }
          professionId={
            professionId
          }
          qualityFilter={
            qualityFilter
          }
        />
      )}

      {mode === "search" && (
        <ProfessionFindCraftByRecipe
          detail={detail}
          professionId={professionId}
          qualityFilter={
            qualityFilter
          }
        />
      )}

      {mode === "character" && (
        <ProfessionCrafterWorkspace
          detail={detail}
          professionId={professionId}
          qualityFilter={
            qualityFilter
          }
        />
      )}
    </section>
  );
}
