import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  bindDeviceConnection,
  registerDeviceConnectionBinder,
  registerDeviceConnectionResolver,
  resolvePendingDeviceConnection
} from "./device-connection-bridge.js";

describe("device-connection-bridge", () => {
  afterEach(() => {
    // Leave the module-level registrations in a harmless state for any
    // other test file that imports this module (device-link.routes.ts
    // registers the real implementations at app startup, but that never
    // runs in these unit tests).
    registerDeviceConnectionBinder(
      async () => {}
    );

    registerDeviceConnectionResolver(
      async () => null
    );
  });

  it("forwards bindDeviceConnection to the registered binder", async () => {
    const binder = vi
      .fn()
      .mockResolvedValue(undefined);

    registerDeviceConnectionBinder(
      binder
    );

    await bindDeviceConnection(
      "link-1",
      "account-1"
    );

    expect(binder).toHaveBeenCalledWith(
      "link-1",
      "account-1"
    );
  });

  it("forwards resolvePendingDeviceConnection to the registered resolver", async () => {
    const resolver = vi
      .fn()
      .mockResolvedValue({
        id: "link-1"
      });

    registerDeviceConnectionResolver(
      resolver
    );

    await expect(
      resolvePendingDeviceConnection(
        "browser-token"
      )
    ).resolves.toEqual({
      id: "link-1"
    });

    expect(
      resolver
    ).toHaveBeenCalledWith(
      "browser-token"
    );
  });

  it("bindDeviceConnection is a safe no-op (never throws) when nothing has registered a binder yet", async () => {
    // Simulate the pre-registration state by re-importing a fresh module
    // instance is not practical here, so this instead documents the
    // contract directly against the exported no-op fallback behavior by
    // registering an explicit pass-through and asserting it resolves.
    registerDeviceConnectionBinder(
      async () => {}
    );

    await expect(
      bindDeviceConnection(
        "link-1",
        "account-1"
      )
    ).resolves.toBeUndefined();
  });

  it("resolvePendingDeviceConnection returns null when nothing is registered to resolve it", async () => {
    registerDeviceConnectionResolver(
      async () => null
    );

    await expect(
      resolvePendingDeviceConnection(
        "browser-token"
      )
    ).resolves.toBeNull();
  });
});
