import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { errorMiddleware } from "./errorMiddleware.js";

describe("errorMiddleware", () => {
  let server: ReturnType<express.Express["listen"]> | null = null;

  afterEach(() => {
    server?.close();
    server = null;
  });

  async function post(body: string) {
    const app = express();
    app.use(express.json());
    app.post("/echo", (_request, response) => {
      response.json({ ok: true });
    });
    app.use(errorMiddleware);

    server = app.listen(0);
    const { port } = server.address() as AddressInfo;

    return fetch(`http://127.0.0.1:${port}/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
  }

  it("answers a malformed JSON body with a controlled 400, not a 500", async () => {
    const response = await post("not json");

    expect(response.status).toBe(400);
    const payload = await response.json() as Record<string, unknown>;
    expect(payload.error).toBe("Die übermittelten Daten sind ungültig.");
    expect(JSON.stringify(payload)).not.toContain("Unexpected token");
  });

  it("still passes a valid JSON body through", async () => {
    const response = await post("{\"a\":1}");

    expect(response.status).toBe(200);
  });
});
