import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4000),

  FRONTEND_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:5173"),

  DATABASE_URL: z
    .string()
    .default("file:./prisma/dev.db"),

  CRAFTING_MIN_LEVEL: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(80),

  BATTLENET_REGION: z
    .enum(["us", "eu", "kr", "tw"])
    .default("eu"),

  BATTLENET_LOCALE: z
    .string()
    .min(2)
    .default("de_DE"),

  BATTLENET_CLIENT_ID: z
    .string()
    .trim()
    .default(""),

  BATTLENET_CLIENT_SECRET: z
    .string()
    .trim()
    .default(""),

  BATTLENET_RAIDER_REDIRECT_URI: z
    .string()
    .url()
    .default(
      "http://localhost:4000/api/auth/raider/callback"
    ),

  WARCRAFTLOGS_CLIENT_ID: z
    .string()
    .trim()
    .default(""),

  WARCRAFTLOGS_CLIENT_SECRET: z
    .string()
    .trim()
    .default(""),

  /*
   * Phase G3B: best-effort raw-ingest diagnostics DB (separate from
   * dev.db) - see ingest-observation.config.ts. Left unvalidated as an
   * environment-sensitive default below rather than a plain zod
   * `.default()`, since "enabled" must depend on NODE_ENV, not be a
   * fixed value. Only the exact strings "true"/"1"/"false"/"0" are
   * accepted when set at all - an unrecognized value fails startup
   * instead of being silently treated as enabled.
   */
  INGEST_OBSERVATION_ENABLED: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(["true", "1", "false", "0"]))
    .optional(),

  INGEST_OBSERVATION_DB_PATH: z
    .string()
    .trim()
    .default("./prisma/ingest-observation.db"),

  /*
   * Where the built desktop-client installer(s) are dropped for
   * self-hosted download via /api/client-download - never committed
   * (see .gitignore). Resolved relative to apps/api, same convention
   * as DATABASE_URL/INGEST_OBSERVATION_DB_PATH.
   */
  CLIENT_DOWNLOAD_DIR: z
    .string()
    .trim()
    .default("./public/client-downloads")
});

const parsedEnvironment = environmentSchema.safeParse(
  process.env
);

if (!parsedEnvironment.success) {
  throw new Error(
    `Invalid environment configuration: ${parsedEnvironment.error.message}`
  );
}

/*
 * Production must never start recording raw provider/addon payloads
 * implicitly - it stays disabled unless INGEST_OBSERVATION_ENABLED is
 * explicitly set. The `test` NODE_ENV (set automatically by Vitest)
 * gets the same safe-by-default posture rather than development's
 * debugging convenience, so tests never touch a shared file unless a
 * test explicitly opts back in (as every ingest-observation test does).
 * An explicit true/false always wins outright, in every environment.
 */
const ingestObservationDefaultEnabled =
  parsedEnvironment.data.NODE_ENV === "development";

const ingestObservationEnabled =
  parsedEnvironment.data.INGEST_OBSERVATION_ENABLED === undefined
    ? ingestObservationDefaultEnabled
    : parsedEnvironment.data.INGEST_OBSERVATION_ENABLED === "true" ||
      parsedEnvironment.data.INGEST_OBSERVATION_ENABLED === "1";

export const env = {
  ...parsedEnvironment.data,
  INGEST_OBSERVATION_ENABLED: ingestObservationEnabled
};