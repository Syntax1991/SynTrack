import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { DataHealthRepository } from "../../../my-syntrack/api/data-health/data-health.repository.js";
import { GearReadinessRepository } from "../../../my-syntrack/api/gear-readiness/gear-readiness.repository.js";
import { GearReadinessService } from "../../../my-syntrack/api/gear-readiness/gear-readiness.service.js";
import { deviceCredentialAuthService } from "../device-auth/device-link.routes.js";
import { ClientCharactersController } from "./client-characters.controller.js";
import { ClientCharactersService } from "./client-characters.service.js";

const gearReadinessService =
  new GearReadinessService(
    new GearReadinessRepository()
  );

const dataHealthRepository =
  new DataHealthRepository();

const service = new ClientCharactersService(
  async (raiderAccountId) => {
    const rows =
      await prisma.character.findMany({
        where: { raiderAccountId },
        orderBy: [
          { name: "asc" },
          { realm: "asc" }
        ],
        select: {
          id: true,
          name: true,
          realm: true,
          className: true,
          level: true
        }
      });

    return rows;
  },
  async (characterIds) => {
    if (characterIds.length === 0) {
      return new Map();
    }

    const overview =
      await gearReadinessService.getOverview();

    const idSet = new Set(characterIds);

    return new Map(
      overview.characters
        .filter((character) =>
          idSet.has(character.id)
        )
        .map((character) => [
          character.id,
          character.averageItemLevel
        ])
    );
  },
  async (characterIds) => {
    if (characterIds.length === 0) {
      return new Map();
    }

    const [
      gearSummaries,
      resourceSummaries
    ] = await Promise.all([
      dataHealthRepository.findGearSlotSummary(
        characterIds
      ),
      dataHealthRepository.findResourceSnapshotSummary(
        characterIds
      )
    ]);

    const lastCapturedAt = new Map<
      string,
      Date | null
    >();

    for (const row of gearSummaries) {
      lastCapturedAt.set(
        row.characterId,
        row.maxLastSyncedAt
      );
    }

    for (const row of resourceSummaries) {
      const existing =
        lastCapturedAt.get(
          row.characterId
        ) ?? null;

      const candidate =
        row.maxCapturedAt;

      if (
        candidate &&
        (!existing ||
          candidate > existing)
      ) {
        lastCapturedAt.set(
          row.characterId,
          candidate
        );
      }
    }

    return lastCapturedAt;
  }
);

const controller =
  new ClientCharactersController(
    (rawToken) =>
      deviceCredentialAuthService.requireValidCredential(
        rawToken
      ),
    service
  );

export const clientCharactersRouter =
  Router();

clientCharactersRouter.get(
  "/characters",
  asyncHandler(controller.list)
);
