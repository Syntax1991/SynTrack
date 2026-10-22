import { apiRequest } from "../../../../../apps/web/src/shared/api/httpClient";
import type {
  BonusRoll,
  BonusRollCreateInput,
  BonusRollResultInput,
  JournalEncounter,
  JournalInstance,
  JournalLootItem
} from "../types/bonusRoll.types";

export function listBonusRolls(): Promise<{ items: BonusRoll[] }> {
  return apiRequest("/bonus-rolls");
}

export function createBonusRoll(input: BonusRollCreateInput): Promise<BonusRoll> {
  return apiRequest("/bonus-rolls", { method: "POST", body: JSON.stringify(input) });
}

export function updateBonusRollTarget(id: string, targetItemId: number | null): Promise<BonusRoll> {
  return apiRequest(`/bonus-rolls/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ targetItemId })
  });
}

export function recordBonusRollResult(id: string, input: BonusRollResultInput): Promise<BonusRoll> {
  return apiRequest(`/bonus-rolls/${encodeURIComponent(id)}/result`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function clearBonusRollResult(id: string): Promise<BonusRoll> {
  return apiRequest(`/bonus-rolls/${encodeURIComponent(id)}/result`, { method: "DELETE" });
}

export function deleteBonusRoll(id: string): Promise<void> {
  return apiRequest(`/bonus-rolls/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listJournalInstances(): Promise<{ items: JournalInstance[] }> {
  return apiRequest("/bonus-rolls/catalog/instances");
}

export function listJournalEncounters(instanceId: number): Promise<{ items: JournalEncounter[] }> {
  return apiRequest(`/bonus-rolls/catalog/instances/${instanceId}/encounters`);
}

export function listJournalLoot(instanceId: number, encounterId: number): Promise<{ items: JournalLootItem[] }> {
  return apiRequest(`/bonus-rolls/catalog/instances/${instanceId}/encounters/${encounterId}/loot`);
}
