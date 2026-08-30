export type ClientProfileResult = {
  /*
   * Null covers two distinct cases the client must treat the same way
   * (no identity to show, not an error): the device credential predates
   * this feature (issued before DeviceCredential.raiderAccountId
   * existed), or the approving RaiderAccount has no battleTag on file.
   */
  battleTag: string | null;
};
