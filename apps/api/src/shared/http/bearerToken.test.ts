import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { AppError } from "../errors/AppError.js";
import { requireBearerToken } from "./bearerToken.js";

function requestWithAuthHeader(
  authorization?: string
): Request {
  return {
    headers: {
      authorization
    }
  } as unknown as Request;
}

describe("requireBearerToken", () => {
  it("rejects a request with no Authorization header at all — the unauthenticated case", () => {
    expect(() =>
      requireBearerToken(
        requestWithAuthHeader(undefined)
      )
    ).toThrow(AppError);
  });

  it("rejects a non-Bearer Authorization header", () => {
    expect(() =>
      requireBearerToken(
        requestWithAuthHeader(
          "Basic dXNlcjpwYXNz"
        )
      )
    ).toThrow(AppError);
  });

  it("rejects an empty Bearer token", () => {
    expect(() =>
      requireBearerToken(
        requestWithAuthHeader("Bearer ")
      )
    ).toThrow(AppError);
  });

  it("extracts the token from a real Bearer header", () => {
    expect(
      requireBearerToken(
        requestWithAuthHeader(
          "Bearer real-token-value"
        )
      )
    ).toBe("real-token-value");
  });
});
