import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ExternalSnapshotDomain,
  ExternalSnapshotRecord,
  ExternalSnapshotSource
} from "./character-external-sync.types.js";

/*
 * A failed attempt must never clear a prior successful payload/
 * fetchedAt - only recordSuccess ever writes those two fields. This is
 * what lets "Blizzard fetch temporarily fails -> keep serving the last
 * successful snapshot" fall out of the data model itself rather than
 * needing special-case logic in every reader.
 */
export class CharacterExternalSnapshotRepository {
  async findOne<TPayload>(
    characterId: string,
    source: ExternalSnapshotSource,
    domain: ExternalSnapshotDomain
  ): Promise<ExternalSnapshotRecord<TPayload> | null> {
    const row = await prisma.characterExternalSnapshot.findUnique({
      where: {
        characterId_source_domain: {
          characterId,
          source,
          domain
        }
      }
    });

    if (!row) {
      return null;
    }

    return {
      characterId: row.characterId,
      source: row.source as ExternalSnapshotSource,
      domain: row.domain as ExternalSnapshotDomain,
      payload: row.payloadJson
        ? (JSON.parse(row.payloadJson) as TPayload)
        : null,
      fetchedAt: row.fetchedAt,
      lastAttemptAt: row.lastAttemptAt,
      lastStatus: row.lastStatus as "SUCCESS" | "FAILED",
      lastError: row.lastError
    };
  }

  async recordSuccess(
    characterId: string,
    source: ExternalSnapshotSource,
    domain: ExternalSnapshotDomain,
    payload: unknown
  ): Promise<void> {
    const now = new Date();
    const payloadJson = JSON.stringify(payload);

    await prisma.characterExternalSnapshot.upsert({
      where: {
        characterId_source_domain: {
          characterId,
          source,
          domain
        }
      },
      create: {
        characterId,
        source,
        domain,
        payloadJson,
        fetchedAt: now,
        lastAttemptAt: now,
        lastStatus: "SUCCESS",
        lastError: null
      },
      update: {
        payloadJson,
        fetchedAt: now,
        lastAttemptAt: now,
        lastStatus: "SUCCESS",
        lastError: null
      }
    });
  }

  async recordFailure(
    characterId: string,
    source: ExternalSnapshotSource,
    domain: ExternalSnapshotDomain,
    errorMessage: string
  ): Promise<void> {
    const now = new Date();
    // Never let a stray long error string (or, defensively, anything
    // resembling a token/secret) grow unbounded in the DB.
    const safeMessage = errorMessage.slice(0, 300);

    await prisma.characterExternalSnapshot.upsert({
      where: {
        characterId_source_domain: {
          characterId,
          source,
          domain
        }
      },
      create: {
        characterId,
        source,
        domain,
        payloadJson: null,
        fetchedAt: null,
        lastAttemptAt: now,
        lastStatus: "FAILED",
        lastError: safeMessage
      },
      // Deliberately omits payloadJson/fetchedAt - a failed attempt
      // must not touch the last successful snapshot.
      update: {
        lastAttemptAt: now,
        lastStatus: "FAILED",
        lastError: safeMessage
      }
    });
  }
}
