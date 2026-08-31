/*
 * A deliberately dependency-free indirection between device-auth and
 * raider-auth. The OAuth callback (raider-auth) needs to bind a pending
 * codeless device connection once an account is known, and needs to
 * validate a raw browser capability before it ever starts an OAuth round
 * trip - but device-auth already depends on raider-auth (DeviceLinkService
 * needs requireSession/getAccountDisplay), so raider-auth importing the
 * real DeviceLinkService back would be a circular module import between
 * the two routes files. Both sides only ever import *this* leaf module
 * instead: device-link.routes.ts registers the real implementations at
 * startup (before any request can be served - apiRouter.ts imports both
 * routers unconditionally at module load), and raider-auth's callback
 * code calls the exported functions without ever importing device-auth
 * directly.
 */
type Binder = (
  deviceLinkRequestId: string,
  raiderAccountId: string
) => Promise<void>;

type Resolver = (
  browserToken: string
) => Promise<{ id: string } | null>;

let binder: Binder | null = null;
let resolver: Resolver | null = null;

export function registerDeviceConnectionBinder(
  fn: Binder
): void {
  binder = fn;
}

export function registerDeviceConnectionResolver(
  fn: Resolver
): void {
  resolver = fn;
}

/*
 * No-op (with a warning) rather than throwing when unregistered - a
 * device-connect journey is opportunistic plumbing on top of ordinary
 * login/register, and a wiring gap here must never turn into a broken
 * Battle.net login for every user.
 */
export async function bindDeviceConnection(
  deviceLinkRequestId: string,
  raiderAccountId: string
): Promise<void> {
  if (!binder) {
    console.warn(
      "[device-connection-bridge] bindDeviceConnection called before a binder was registered - skipping."
    );

    return;
  }

  await binder(
    deviceLinkRequestId,
    raiderAccountId
  );
}

export async function resolvePendingDeviceConnection(
  browserToken: string
): Promise<{ id: string } | null> {
  if (!resolver) {
    console.warn(
      "[device-connection-bridge] resolvePendingDeviceConnection called before a resolver was registered - returning null."
    );

    return null;
  }

  return resolver(browserToken);
}
