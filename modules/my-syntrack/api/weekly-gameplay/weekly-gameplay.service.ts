import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { deriveWeeklyGameplay } from "./weekly-gameplay.deriver.js";
import { WeeklyGameplayRepository } from "./weekly-gameplay.repository.js";
import type { WeeklyGameplayCharacterView } from "./weekly-gameplay.types.js";

export class WeeklyGameplayService {
  constructor(
    private readonly repository: WeeklyGameplayRepository
  ) {}

  async getOverview(): Promise<{
    periodKey: string;
    characters: WeeklyGameplayCharacterView[];
  }> {
    const period = getWeeklyPeriod();
    const snapshots = await this.repository.findSnapshotsForPeriod(
      period.key
    );

    return {
      periodKey: period.key,
      characters: snapshots.map(deriveWeeklyGameplay)
    };
  }
}
