import { useState } from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { BossRosterMatrix } from "../../boss-rosters/components/BossRosterMatrix";
import type {
  RaidBoss,
  RaidBossInput,
  RaidBossRosterStatus
} from "../../boss-rosters/types/bossRoster.types";
import type { RaidSignupEntry } from "../../signups/types/signup.types";
import { BossRosterOverview } from "./BossRosterOverview";

type BossRosterSectionProps = {
  bosses: RaidBoss[];
  isLoading: boolean;
  rosterMembers: GuildMember[];
  poolMemberIds: Set<string>;
  signupEntries: RaidSignupEntry[];
  onAddBoss: (
    input: RaidBossInput
  ) => Promise<void>;
  onDeleteBoss: (
    boss: RaidBoss
  ) => void;
  onSetStatus: (
    bossId: string,
    memberId: string,
    status: RaidBossRosterStatus
  ) => void;
  onClearStatus: (
    bossId: string,
    memberId: string
  ) => void;
  onSetSpec: (
    bossId: string,
    memberId: string,
    specId: number | null
  ) => void;
};

export function BossRosterSection({
  bosses,
  isLoading,
  rosterMembers,
  poolMemberIds,
  signupEntries,
  onAddBoss,
  onDeleteBoss,
  onSetStatus,
  onClearStatus,
  onSetSpec
}: BossRosterSectionProps) {
  const [isEditing, setIsEditing] =
    useState(false);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            SETUP
          </p>

          <h2>
            {bosses.length} Bosses
          </h2>
        </div>

        <button
          className="button button-secondary"
          onClick={() =>
            setIsEditing(
              (current) => !current
            )
          }
          type="button"
        >
          {isEditing
            ? "Done"
            : "Edit"}
        </button>
      </div>

      {isLoading ? (
        <LoadingPanel />
      ) : isEditing ? (
        <BossRosterMatrix
          bosses={bosses}
          onAddBoss={onAddBoss}
          onClearStatus={
            onClearStatus
          }
          onDeleteBoss={
            onDeleteBoss
          }
          onSetSpec={onSetSpec}
          onSetStatus={
            onSetStatus
          }
          poolMemberIds={
            poolMemberIds
          }
          rosterMembers={
            rosterMembers
          }
          signupEntries={
            signupEntries
          }
        />
      ) : (
        <BossRosterOverview
          entries={signupEntries}
        />
      )}
    </section>
  );
}
