import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type { CharacterWeeklyState } from "../../overview/types/overview.types";
import {
  formatEmbellishmentToken,
  formatGearToken,
  formatItemLevelToken,
  formatTierToken,
  formatVaultToken,
  formatWeeklyToken
} from "../../overview/utils/overviewCellFormatting";

type CharacterStatusStripProps = {
  character: CharacterWeeklyState;
};

/*
 * Reuses the exact same token formatters the Overview matrix already
 * uses for these columns - no new item-level/vault/gear semantics are
 * invented here, only reread and rendered compactly.
 */
export function CharacterStatusStrip({
  character
}: CharacterStatusStripProps) {
  const entries: {
    label: string;
    path?: string;
    token: ReturnType<
      typeof formatWeeklyToken
    >;
  }[] = [
    {
      label: "iLvl",
      token: formatItemLevelToken(
        character.gear
      )
    },
    {
      label: "Set",
      token: formatTierToken(
        character.tier
      )
    },
    {
      label: "Emb.",
      token:
        formatEmbellishmentToken(
          character.embellishments
        )
    },
    {
      label: "Weeklies",
      path: "/weekly-checklist",
      token: formatWeeklyToken(
        character.weekly
      )
    },
    {
      label: "Vault",
      path: "/vault-mythic-plus",
      token: formatVaultToken(
        character.vault
      )
    },
    {
      label: "Gear",
      token: formatGearToken(
        character.gear
      )
    }
  ];

  return (
    <div className="character-status-strip">
      {entries.map((entry) =>
        entry.path ? (
          <Link
            className="character-status-cell"
            key={entry.label}
            to={entry.path}
          >
            <span className="character-status-label">
              {entry.label}
            </span>

            <StatusToken
              token={entry.token}
            />
          </Link>
        ) : (
          <div
            className="character-status-cell character-status-cell-static"
            key={entry.label}
          >
            <span className="character-status-label">
              {entry.label}
            </span>

            <StatusToken
              token={entry.token}
            />
          </div>
        )
      )}
    </div>
  );
}
