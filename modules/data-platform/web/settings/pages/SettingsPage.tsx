import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { Tabs } from "../../../../../apps/web/src/shared/components/Tabs";
import { AdvancedManualDeviceLinkPanel } from "../../../../data-platform/web/device-auth/components/AdvancedManualDeviceLinkPanel";
import { ConnectedDevicesPanel } from "../../../../data-platform/web/device-auth/components/ConnectedDevicesPanel";
import { AccountSettingsPanel } from "../../../../data-platform/web/settings/components/AccountSettingsPanel";
import { BattleNetSettingsPanel } from "../../../../data-platform/web/settings/components/BattleNetSettingsPanel";
import { WoWSyncTab } from "../../../../data-platform/web/settings/components/WoWSyncTab";
import { TagManagerPanel } from "../../../../my-syntrack/web/tags/components/TagManagerPanel";
import { SeasonSwitchPanel } from "../../../../my-syntrack/web/season/components/SeasonSwitchPanel";
import { useState } from "react";

type SettingsPageTab =
  | "account"
  | "wow-sync"
  | "battlenet"
  | "devices"
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
    id: "wow-sync",
    label: "WoW Sync"
  },
  {
    id: "battlenet",
    label: "Battle.net"
  },
  {
    id: "devices",
    label: "Devices"
  },
  {
    id: "tags-season",
    label: "Tags & Season"
  }
];

export function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsPageTab>(
      "account"
    );

  return (
    <div className="guild-page guild-page-narrow">
      <PageHeader
        description="Account identity, WoW sync trust, Battle.net connection, and personal preferences."
        eyebrow="CONTROL"
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
          <AccountSettingsPanel />
        )}

        {activeTab === "wow-sync" && (
          <WoWSyncTab />
        )}

        {activeTab === "battlenet" && (
          <BattleNetSettingsPanel />
        )}

        {activeTab === "devices" && (
          <>
            <ConnectedDevicesPanel />
            <AdvancedManualDeviceLinkPanel />
          </>
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
