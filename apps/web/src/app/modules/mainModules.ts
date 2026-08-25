import { automationModule } from "./definitions/automation.definition";
import { guildModule } from "./definitions/guild.definition";
import { lootModule } from "./definitions/loot.definition";
import { mySynTrackModule } from "./definitions/mySynTrack.definition";
import { professionsModule } from "./definitions/professions.definition";
import { recruitmentModule } from "./definitions/recruitment.definition";
import type { MainModuleDefinition } from "./moduleTypes";

export type {
  MainModuleDefinition,
  MainModuleItem,
  MainModuleItemStatus,
  MainModuleStatus
} from "./moduleTypes";

export const mainModules:
  MainModuleDefinition[] = [
    mySynTrackModule,
    guildModule,
    lootModule,
    professionsModule,
    recruitmentModule,
    automationModule
  ];

export function getAvailableModuleItems(
  module: MainModuleDefinition
) {
  return module.items.filter(
    (item) =>
      item.status === "available" &&
      typeof item.path === "string"
  );
}

export function getPlannedModuleItemCount(
  module: MainModuleDefinition
) {
  return module.items.filter(
    (item) =>
      item.status === "planned"
  ).length;
}
