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
