import { env } from "../../../../apps/api/src/config/env.js";

export type AdminAccountIdentity = {
  battleNetAccountId: string | null;
  battleTag: string | null;
};

function unwrapQuoted(entry: string): string {
  const trimmed = entry.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function parseAllowlist(raw: string): string[] {
  return raw
    .split(",")
    .map(unwrapQuoted)
    .filter((entry) => entry.length > 0);
}

export function parseAdminAllowlist(
  accountIdsRaw: string | undefined = env.SYNTRACK_ADMIN_BATTLE_NET_ACCOUNT_IDS,
  battleTagsRaw: string | undefined = env.SYNTRACK_ADMIN_BATTLE_TAGS
): {
  accountIds: string[];
  battleTags: string[];
} {
  return {
    accountIds: parseAllowlist(accountIdsRaw ?? ""),
    battleTags: parseAllowlist(battleTagsRaw ?? "")
  };
}

export function isAdminIdentity(
  identity: AdminAccountIdentity,
  allowlist: ReturnType<typeof parseAdminAllowlist> = parseAdminAllowlist()
): boolean {
  const accountId = identity.battleNetAccountId;

  if (
    accountId !== null &&
    allowlist.accountIds.includes(accountId)
  ) {
    return true;
  }

  const battleTag = identity.battleTag;

  if (battleTag === null) {
    return false;
  }

  const normalized = battleTag.toLowerCase();

  return allowlist.battleTags.some(
    (entry) => entry.toLowerCase() === normalized
  );
}
