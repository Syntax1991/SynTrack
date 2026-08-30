export type ClientIdentityStatus =
  | "connected"
  | "legacy_reconnect_required";

export type ClientProfileResult = {
  /*
   * connected = DeviceCredential has a resolvable RaiderAccount owner.
   * legacy_reconnect_required = valid credential but no raiderAccountId
   * (issued before ownership linkage). Never auto-assign; client must
   * reconnect via Battle.net to bind a canonical owner.
   */
  identityStatus: ClientIdentityStatus;
  /*
   * Present only when identityStatus is connected and the RaiderAccount
   * has a battleTag on file. Null battleTag with connected status means
   * ownership is proven but Battle.net has not supplied a tag yet.
   */
  battleTag: string | null;
};
