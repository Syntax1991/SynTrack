import { Drawer } from "../../../../../apps/web/src/shared/components/Drawer";
import type {
  MythicPlusRunInput,
  VaultCharacter
} from "../types/vaultMythicPlus.types";
import { VaultRunForm } from "./VaultRunForm";
import { VaultRunHistory } from "./VaultRunHistory";

type VaultRunLogDrawerProps = {
  character: VaultCharacter;
  pendingAction: string | null;
  onClose: () => void;
  onAddRun: (
    input: MythicPlusRunInput
  ) => Promise<boolean>;
  onDeleteRun: (runId: string) => void;
};

/*
 * Manual run logging is a secondary interaction now - it lives behind
 * "Log run" on the account-wide matrix instead of permanently
 * reserving half the page for what is often an empty Run Log.
 */
export function VaultRunLogDrawer({
  character,
  pendingAction,
  onClose,
  onAddRun,
  onDeleteRun
}: VaultRunLogDrawerProps) {
  return (
    <Drawer
      onClose={onClose}
      title={`Log run · ${character.name}`}
    >
      <p className="vault-drawer-hint">
        {character.runs.length}{" "}
        {character.runs.length === 1
          ? "run"
          : "runs"}{" "}
        logged this period. Reward
        levels use your highest,
        fourth-highest and
        eighth-highest logged run.
      </p>

      <VaultRunForm
        onAddRun={onAddRun}
        pendingAction={pendingAction}
      />

      <VaultRunHistory
        onDeleteRun={onDeleteRun}
        pendingAction={pendingAction}
        runs={character.runs}
      />
    </Drawer>
  );
}
