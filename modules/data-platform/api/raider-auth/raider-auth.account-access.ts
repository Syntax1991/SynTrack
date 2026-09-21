import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import {
  RAIDER_ACCOUNT_PENDING,
  isActiveRaiderAccountStatus
} from "../admin-users/admin-account-status.js";

export function assertActiveRaiderAccount(
  status: string | null | undefined
): void {
  if (isActiveRaiderAccountStatus(status)) {
    return;
  }

  if (status === RAIDER_ACCOUNT_PENDING) {
    throw new AppError(
      403,
      "Dieses SynTrack-Konto wartet auf Freigabe."
    );
  }

  throw new AppError(
    403,
    "Dieses SynTrack-Konto ist deaktiviert."
  );
}
