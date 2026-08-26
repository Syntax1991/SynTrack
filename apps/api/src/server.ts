import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./infrastructure/database/prismaClient.js";
import { professionIconResolutionService } from "../../../modules/professions/api/icons/profession-icon-resolution.service.js";
import { professionItemQualityResolutionService } from "../../../modules/professions/api/icons/profession-item-quality-resolution.service.js";

const server = app.listen(
  env.PORT,
  () => {
    console.log(
      `SynTrack API is running on http://localhost:${env.PORT}`
    );

    /*
     * Non-blocking startup top-up: resolves real Blizzard icons for any
     * recipe/specialization-node rows imported before this feature
     * existed (or left over from a prior failed lookup). Idempotent -
     * once every row has an iconUrl, this is a fast empty-result query.
     */
    void professionIconResolutionService
      .backfillMissingIcons()
      .catch(
        (error: unknown) => {
          console.error(
            "Profession icon startup backfill failed.",
            error
          );
        }
      );

    /*
     * Same non-blocking, idempotent startup top-up, for item quality/
     * level instead of icons.
     */
    void professionItemQualityResolutionService
      .backfillMissingQuality()
      .catch(
        (error: unknown) => {
          console.error(
            "Profession item quality startup backfill failed.",
            error
          );
        }
      );
  }
);

async function shutdown(
  signal: string
) {
  console.log(
    `${signal} received. Shutting down.`
  );

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on(
  "SIGINT",
  () => {
    void shutdown("SIGINT");
  }
);

process.on(
  "SIGTERM",
  () => {
    void shutdown("SIGTERM");
  }
);