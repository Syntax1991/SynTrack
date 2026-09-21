import { useState } from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AdminUserListItem } from "../types/adminUsers.types";

function statusLabel(status: string): string {
  if (status === "PENDING_APPROVAL") {
    return "Waiting";
  }

  if (status === "DISABLED") {
    return "Disabled";
  }

  return "Active";
}

function formatWhen(value: string | null): string {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export function AdminUsersPanel() {
  const admin = useAdminUsers();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmTag, setConfirmTag] = useState("");

  return (
    <section className="panel character-tags-manager">
      <h2>Users</h2>
      <p className="character-tags-manager-hint">
        Approve registrations, disable access, stop public crafter
        sharing, or delete an account and its owned characters.
        Operator allowlist accounts cannot be changed here.
      </p>

      {admin.error ? (
        <p className="character-tags-manager-error">{admin.error}</p>
      ) : null}

      {admin.isLoading ? (
        <LoadingPanel />
      ) : (
        <ul className="character-tags-manager-list">
          {admin.users.map((user) => (
            <AdminUserRow
              confirmTag={deleteId === user.id ? confirmTag : ""}
              key={user.id}
              onApprove={() => void admin.approve(user.id)}
              onConfirmTagChange={setConfirmTag}
              onDelete={() => {
                if (deleteId === user.id) {
                  void admin.remove(user.id, confirmTag);
                  return;
                }

                setDeleteId(user.id);
                setConfirmTag("");
              }}
              onDisable={() => void admin.disable(user.id)}
              onEnable={() => void admin.enable(user.id)}
              onRevokeShare={() => void admin.revokeShare(user.id)}
              pendingDelete={deleteId === user.id}
              user={user}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AdminUserRow({
  user,
  pendingDelete,
  confirmTag,
  onConfirmTagChange,
  onApprove,
  onDisable,
  onEnable,
  onRevokeShare,
  onDelete
}: {
  user: AdminUserListItem;
  pendingDelete: boolean;
  confirmTag: string;
  onConfirmTagChange: (value: string) => void;
  onApprove: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onRevokeShare: () => void;
  onDelete: () => void;
}) {
  return (
    <li>
      <span>
        {user.battleTag ?? "Unknown BattleTag"}
        {" · "}
        {statusLabel(user.status)}
        {user.isAdmin ? " · Operator" : ""}
        {" · "}
        {user.characterCount} chars
        {" · last session "}
        {formatWhen(user.lastSessionAt)}
        {user.shareEnabled ? " · sharing" : ""}
      </span>
      <span>
        {user.status === "PENDING_APPROVAL" ? (
          <button className="text-button" onClick={onApprove} type="button">
            Approve
          </button>
        ) : null}
        {user.status === "ACTIVE" && !user.isAdmin ? (
          <button className="text-button" onClick={onDisable} type="button">
            Disable
          </button>
        ) : null}
        {user.status === "DISABLED" ? (
          <button className="text-button" onClick={onEnable} type="button">
            Enable
          </button>
        ) : null}
        {user.shareEnabled && !user.isAdmin ? (
          <button
            className="text-button"
            onClick={onRevokeShare}
            type="button"
          >
            Stop sharing
          </button>
        ) : null}
        {!user.isAdmin ? (
          pendingDelete ? (
            <>
              <input
                aria-label="Type BattleTag to delete"
                onChange={(event) => onConfirmTagChange(event.target.value)}
                placeholder={user.battleTag ?? "BattleTag"}
                value={confirmTag}
              />
              <button
                className="text-button danger"
                onClick={onDelete}
                type="button"
              >
                Confirm delete
              </button>
            </>
          ) : (
            <button className="text-button danger" onClick={onDelete} type="button">
              Delete
            </button>
          )
        ) : null}
      </span>
    </li>
  );
}
