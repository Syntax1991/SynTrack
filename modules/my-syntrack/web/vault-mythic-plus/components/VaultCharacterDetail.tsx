import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type {
  VaultGameplayCharacter,
  VaultSlotDetail
} from "../types/vaultMythicPlus.types";
import {
  formatDomainProgressText,
  formatDomainSlotUnlockText,
  formatSlotToken
} from "../utils/vaultCellFormatting";

type VaultCharacterDetailProps = {
  character: VaultGameplayCharacter;
};

function SlotRows({
  title,
  slots,
  activityLabel
}: {
  title: string;
  slots: VaultSlotDetail[];
  activityLabel: string;
}) {
  return (
    <section className="vault-detail-section">
      <h3>{title}</h3>
      <table className="dense-matrix vault-slot-table">
        <thead>
          <tr>
            <th>Slot</th>
            <th>State</th>
            <th>Progress</th>
            <th>Reward</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const token = formatSlotToken(slot);

            return (
              <tr key={`${title}-${slot.slot}`}>
                <td>Slot {slot.slot}</td>
                <td>
                  <StatusToken
                    token={{
                      symbol: slot.state,
                      tone: token.tone,
                      title: token.title
                    }}
                  />
                </td>
                <td>
                  {slot.state === "UNKNOWN"
                    ? "—"
                    : slot.progress !== null && slot.threshold !== null
                      ? `${slot.progress} / ${slot.threshold} ${activityLabel}`
                      : "—"}
                </td>
                <td>{slot.rewardLabel ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function VaultCharacterDetail({
  character
}: VaultCharacterDetailProps) {
  const freshness = !character.vaultCaptured
    ? "Not captured this week"
    : character.vaultCurrent
      ? "Current-week Great Vault capture"
      : "Vault period unresolved";
  const showActionSeparately = character.action !== freshness;

  return (
    <section className="panel vault-character-detail">
      <header className="vault-detail-header">
        <div>
          <p className="eyebrow">SELECTED CHARACTER</p>
          <h2>{character.name}</h2>
          <p>
            Vault {formatDomainProgressText(character.vault)}
            {" · "}
            M+ {formatDomainSlotUnlockText(character.mythicPlus)} slots
            {" · "}
            Raid {formatDomainSlotUnlockText(character.raid)} slots
            {" · "}
            Delves {formatDomainSlotUnlockText(character.delves)} slots
          </p>
          <p className="vault-detail-activity">
            M+ {formatDomainProgressText(character.mythicPlus)}
            {" · "}
            Raid {formatDomainProgressText(character.raid)}
            {" · "}
            Delves {formatDomainProgressText(character.delves)}
          </p>
        </div>
        <div className="vault-detail-meta">
          <p>{freshness}</p>
          {showActionSeparately ? (
            <p className="vault-detail-action">{character.action}</p>
          ) : null}
          {character.mythicPlusRunCount !== null ? (
            <p>{character.mythicPlusRunCount} M+ runs this week</p>
          ) : null}
        </div>
      </header>

      <div className="vault-detail-grid">
        <SlotRows
          activityLabel="runs"
          slots={character.mythicPlusSlots}
          title="Mythic+"
        />
        <SlotRows
          activityLabel="bosses"
          slots={character.raidSlots}
          title="Raid"
        />
        <SlotRows
          activityLabel="activities"
          slots={character.worldSlots}
          title="Delves"
        />
      </div>

      {character.mythicPlusRuns.length > 0 ? (
        <section className="vault-detail-section">
          <h3>Mythic+ runs this week</h3>
          <table className="dense-matrix">
            <thead>
              <tr>
                <th>Map</th>
                <th>Key</th>
                <th>Completed</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {character.mythicPlusRuns.map((run, index) => (
                <tr
                  key={`${run.mapChallengeModeId ?? "map"}-${run.keyLevel}-${index}`}
                >
                  <td>
                    {run.mapChallengeModeId !== null
                      ? `Map ${run.mapChallengeModeId}`
                      : "—"}
                  </td>
                  <td>+{run.keyLevel}</td>
                  <td>
                    {run.completed === true
                      ? "Yes"
                      : run.completed === false
                        ? "No"
                        : "?"}
                  </td>
                  <td>
                    {run.durationSec !== null
                      ? `${Math.round(run.durationSec / 60)}m`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </section>
  );
}
