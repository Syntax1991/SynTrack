import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
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
   * dev.db). "false"/"0" disables it explicitly; any other value (and
   * the default) leaves it enabled - see ingest-observation.config.ts.
   */
  INGEST_OBSERVATION_ENABLED: z
    .string()
    .trim()
    .toLowerCase()
    .default("true")
    .transform((value) => value !== "false" && value !== "0"),

  INGEST_OBSERVATION_DB_PATH: z
    .string()
    .trim()
    .default("./prisma/ingest-observation.db")
});

const parsedEnvironment = environmentSchema.safeParse(
  process.env
);

if (!parsedEnvironment.success) {
  throw new Error(
    `Invalid environment configuration: ${parsedEnvironment.error.message}`
  );
}

export const env = parsedEnvironment.data;