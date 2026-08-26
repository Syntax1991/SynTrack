import { automationModule } from "./definitions/automation.definition";
import { mySynTrackModule } from "./definitions/mySynTrack.definition";
import type {
  MainModuleDefinition,
  MainModuleItem
} from "./moduleTypes";

export type {
  MainModuleDefinition,
  MainModuleItem,
  MainModuleItemStatus,
  MainModuleStatus
} from "./moduleTypes";

/*
 * SynTrack's active product surface is the personal core (My SynTrack,
 * which now also composes Professions) plus the Automation roadmap
 * placeholder. Guild/Loot/Recruitment are intentionally not registered
 * here - their backend/routes/models remain for now, but they are no
 * longer part of the active navigation surface.
 */
export const mainModules:
  MainModuleDefinition[] = [
    mySynTrackModule,
    automationModule
  ];

function flattenItems(
  items: MainModuleItem[]
): MainModuleItem[] {
  return items.flatMap(
    (item) =>
      item.items
        ? flattenItems(item.items)
        : [item]
  );
}

export function getAvailableModuleItems(
  module: MainModuleDefinition
) {
  return flattenItems(
    module.items
  ).filter(
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
