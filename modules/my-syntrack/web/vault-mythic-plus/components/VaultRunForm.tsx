import {
  useState,
  type FormEvent
} from "react";
import type { MythicPlusRunInput } from "../types/vaultMythicPlus.types";

type VaultRunFormProps = {
  pendingAction: string | null;
  onAddRun: (
    input: MythicPlusRunInput
  ) => Promise<boolean>;
};

export function VaultRunForm({
  pendingAction,
  onAddRun
}: VaultRunFormProps) {
  const [dungeonName, setDungeonName] =
    useState("");

  const [keyLevel, setKeyLevel] =
    useState("2");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedName =
      dungeonName.trim();

    const input: MythicPlusRunInput =
      normalizedName
        ? {
            dungeonName:
              normalizedName,
            keyLevel: Number(keyLevel)
          }
        : {
            keyLevel: Number(keyLevel)
          };

    const added = await onAddRun(
      input
    );

    if (added) {
      setDungeonName("");
    }
  };

  return (
    <form
      className="vault-run-form"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <label>
        <span>Dungeon</span>
        <input
          maxLength={80}
          onChange={(event) =>
            setDungeonName(
              event.target.value
            )
          }
          placeholder="Optional name"
          value={dungeonName}
        />
      </label>

      <label>
        <span>Key</span>
        <input
          inputMode="numeric"
          max={50}
          min={0}
          onChange={(event) =>
            setKeyLevel(
              event.target.value
            )
          }
          required
          type="number"
          value={keyLevel}
        />
      </label>

      <button
        className="button button-primary"
        disabled={
          pendingAction !== null
        }
        type="submit"
      >
        {pendingAction === "add"
          ? "Adding…"
          : "Add run"}
      </button>
    </form>
  );
}
