export type TrackerScopeProfileRow = {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface TrackerScopeProfileRepositoryContract {
  findAll(): Promise<
    TrackerScopeProfileRow[]
  >;
  findByKey(
    key: string
  ): Promise<TrackerScopeProfileRow | null>;
  findActive(): Promise<TrackerScopeProfileRow | null>;
  create(input: {
    key: string;
    name: string;
  }): Promise<TrackerScopeProfileRow>;
  /*
   * Flips every currently-active row off and the target row on in one
   * transaction - the only way "isActive" is ever mutated, so exactly
   * one profile is active at a time by construction.
   */
  setActive(
    key: string
  ): Promise<TrackerScopeProfileRow>;
}
