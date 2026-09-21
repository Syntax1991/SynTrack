export const RAIDER_ACCOUNT_ACTIVE =
  "ACTIVE";
export const RAIDER_ACCOUNT_PENDING =
  "PENDING_APPROVAL";
export const RAIDER_ACCOUNT_DISABLED =
  "DISABLED";

export type RaiderAccountAccessStatus =
  | typeof RAIDER_ACCOUNT_ACTIVE
  | typeof RAIDER_ACCOUNT_PENDING
  | typeof RAIDER_ACCOUNT_DISABLED;

export function isActiveRaiderAccountStatus(
  status: string | null | undefined
): boolean {
  return status === RAIDER_ACCOUNT_ACTIVE;
}
