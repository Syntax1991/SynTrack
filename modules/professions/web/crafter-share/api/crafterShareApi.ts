import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  CrafterShareStatus,
  PublicCrafterShareCard
} from "../types/crafterShare.types";

export function getCrafterShareStatus() {
  return apiRequest<CrafterShareStatus>("/crafter-share");
}

export function enableCrafterShare() {
  return apiRequest<CrafterShareStatus>("/crafter-share/enable", {
    method: "POST"
  });
}

export function disableCrafterShare() {
  return apiRequest<CrafterShareStatus>("/crafter-share/disable", {
    method: "POST"
  });
}

export function getPublicCrafterShareCard(token: string) {
  return apiRequest<PublicCrafterShareCard>(`/c/${token}`);
}
