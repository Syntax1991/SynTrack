/*
 * Same-origin API: production serves the web app and the API from one
 * origin (https://syntrack.io + /api).
 */
export const productionApiBaseUrl = "/api";

/*
 * An explicit VITE_API_URL always wins; an empty one counts as unset.
 * Otherwise the caller's fallback applies - httpClient picks it with the
 * compile-time import.meta.env.DEV so the local-API literal is dropped
 * from production bundles entirely. The syntrack.io bundle deployed
 * 2026-09-21 was built without VITE_API_URL and shipped
 * http://localhost:4000/api, which broke every browser-side call
 * (including the desktop connect page) for every visitor.
 */
export function resolveApiBaseUrl(
  configured: string | undefined,
  fallback: string
): string {
  const explicit = configured?.trim();

  return (explicit || fallback).replace(/\/+$/u, "");
}
