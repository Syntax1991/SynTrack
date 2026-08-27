import { useState } from "react";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { Tabs } from "../../../../../apps/web/src/shared/components/Tabs";
import { AddonSyncTab } from "../../../../data-platform/web/integrations/components/AddonSyncTab";
import { BattleNetSyncTab } from "../../../../data-platform/web/integrations/components/BattleNetSyncTab";
import { TagManagerPanel } from "../../../../my-syntrack/web/tags/components/TagManagerPanel";
import { SeasonSwitchPanel } from "../../../../my-syntrack/web/season/components/SeasonSwitchPanel";
import { RaiderLinkPanel } from "../components/RaiderLinkPanel";
import { useRaiderLink } from "../hooks/useRaiderLink";

type SettingsPageTab =
  | "account"
  | "addon"
  | "battlenet"
  | "tags-season";

const tabs: Array<{
  id: SettingsPageTab;
  label: string;
}> = [
  {
    id: "account",
    label: "Account"
  },
  {
    id: "addon",
    label: "WoW Addon"
  },
  {
    id: "battlenet",
    label: "Battle.net"
  },
  {
    id: "tags-season",
    label: "Tags & Season"
  }
];

export function SettingsPage() {
  const raiderLink = useRaiderLink();

  const [activeTab, setActiveTab] =
    useState<SettingsPageTab>(
      "account"
    );

  return (
    <div className="guild-page guild-page-narrow">
      <PageHeader
        description="Your Battle.net identity, character data and personal account preferences."
        eyebrow="ACCOUNT"
        title="Settings"
      />

      <Tabs
        activeTab={activeTab}
        ariaLabel="Settings"
        onChange={setActiveTab}
        tabs={tabs}
      />

      <div className="app-tab-content">
        {activeTab === "account" && (
          <>
            {raiderLink.error && (
              <StatusMessage type="error">
                {raiderLink.error}
              </StatusMessage>
            )}

            <RaiderLinkPanel
              isClaiming={
                raiderLink.isClaiming
              }
              isLoading={
                raiderLink.isLoading
              }
              onClaim={(
                memberId
              ) => {
                void raiderLink.claim(
                  memberId
                );
              }}
              onLogout={() => {
                void raiderLink.logout();
              }}
              resolution={
                raiderLink.resolution
              }
            />
          </>
        )}

        {activeTab === "addon" && (
          <AddonSyncTab />
        )}

        {activeTab === "battlenet" && (
          <BattleNetSyncTab />
        )}

        {activeTab ===
          "tags-season" && (
          <>
            <TagManagerPanel />
            <SeasonSwitchPanel />
          </>
        )}
      </div>
    </div>
  );
}
