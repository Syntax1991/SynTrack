import { useState } from "react";
import { Tabs } from "../../../../../apps/web/src/shared/components/Tabs";
import type {
  ProfessionDetail
} from "../types/professionDetail.types";
import type {
  ProfessionFindCraftDeepLink
} from "./ProfessionFindCraftWorkspace";
import {
  ProfessionFindCraftWorkspace
} from "./ProfessionFindCraftWorkspace";
import {
  ProfessionOverviewResponsibilityTable
} from "./ProfessionOverviewResponsibilityTable";
import {
  ProfessionSpecializationsWorkspace
} from "./ProfessionSpecializationsWorkspace";

type ProfessionDetailWorkspaceProps = {
  detail: ProfessionDetail;
  professionId: string;
};

type ProfessionDetailTab =
  | "overview"
  | "find-craft"
  | "specializations";

const tabs: Array<{
  id: ProfessionDetailTab;
  label: string;
}> = [
  {
    id: "overview",
    label: "Overview"
  },
  {
    id: "find-craft",
    label: "Find Craft"
  },
  {
    id: "specializations",
    label: "Specializations"
  }
];

export function ProfessionDetailWorkspace({
  detail,
  professionId
}: ProfessionDetailWorkspaceProps) {
  const [
    activeTab,
    setActiveTab
  ] =
    useState<ProfessionDetailTab>(
      "overview"
    );

  const [
    findCraftDeepLink,
    setFindCraftDeepLink
  ] =
    useState<ProfessionFindCraftDeepLink | null>(
      null
    );

  function navigateToFindCraft(
    familyName: string,
    slotKey: string
  ) {
    if (!slotKey) {
      return;
    }

    setFindCraftDeepLink(
      (previous) => ({
        familyName,
        slotKey,
        nonce:
          (previous?.nonce ?? 0) +
          1
      })
    );

    setActiveTab("find-craft");
  }

  return (
    <>
      <p className="profession-detail-metrics-line">
        <strong>
          {
            detail.summary
              .characterCount
          }
        </strong>
        {
          detail.summary
            .characterCount === 1
            ? " character"
            : " characters"
        }
      </p>

      <Tabs
        activeTab={activeTab}
        ariaLabel="Professionsdetail"
        onChange={setActiveTab}
        tabs={tabs}
      />

      <div
        className="app-tab-content"
        role="tabpanel"
      >
        {activeTab ===
          "overview" && (
          <ProfessionOverviewResponsibilityTable
            detail={detail}
            onNavigateToFindCraft={
              navigateToFindCraft
            }
          />
        )}

        {activeTab ===
          "find-craft" && (
          <ProfessionFindCraftWorkspace
            deepLink={
              findCraftDeepLink
            }
            detail={detail}
            professionId={
              professionId
            }
          />
        )}

        {activeTab ===
          "specializations" && (
          <ProfessionSpecializationsWorkspace
            detail={detail}
          />
        )}
      </div>
    </>
  );
}
