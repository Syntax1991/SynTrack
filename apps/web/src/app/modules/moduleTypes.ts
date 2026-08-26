export type MainModuleStatus =
  | "active"
  | "planned";

export type MainModuleItemStatus =
  | "available"
  | "planned";

export type MainModuleItem = {
  label: string;
  path?: string;
  status: MainModuleItemStatus;
  end?: boolean;
  /*
   * Nested sub-items for a grouped concept within a module (e.g.
   * Professions living inside My SynTrack) - rendered as an indented
   * subgroup, never a second top-level module. A group item carries no
   * path of its own.
   */
  items?: MainModuleItem[];
};

export type MainModuleDefinition = {
  id:
    | "my-syntrack"
    | "guild"
    | "loot"
    | "professions"
    | "recruitment"
    | "automation";
  label: string;
  description: string;
  status: MainModuleStatus;
  items: MainModuleItem[];
};
