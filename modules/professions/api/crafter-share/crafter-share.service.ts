import { env } from "../../../../apps/api/src/config/env.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { mapPublicCrafterShareCard } from "./crafter-share.mapper.js";
import {
  createCrafterShareToken,
  CrafterShareRepository
} from "./crafter-share.repository.js";
import type {
  CrafterShareStatus,
  PublicCrafterShareCard
} from "./crafter-share.types.js";

function buildPublicUrl(token: string, origin: string): string {
  return new URL(`/c/${token}`, origin).toString();
}

function toStatus(
  share: { enabled: boolean; token: string } | null,
  origin: string
): CrafterShareStatus {
  if (!share || !share.enabled) {
    return {
      enabled: false,
      publicUrl: null
    };
  }

  return {
    enabled: true,
    publicUrl: buildPublicUrl(share.token, origin)
  };
}

export class CrafterShareService {
  constructor(
    private readonly repository: CrafterShareRepository,
    private readonly createToken: () => string = createCrafterShareToken,
    private readonly publicOrigin: string = env.FRONTEND_ORIGIN
  ) {}

  async getStatus(raiderAccountId: string): Promise<CrafterShareStatus> {
    const share = await this.repository.findByAccountId(raiderAccountId);

    return toStatus(share, this.publicOrigin);
  }

  async enable(raiderAccountId: string): Promise<CrafterShareStatus> {
    const existing = await this.repository.findByAccountId(raiderAccountId);

    if (!existing) {
      const created = await this.repository.createShare(
        raiderAccountId,
        this.createToken()
      );

      return toStatus(created, this.publicOrigin);
    }

    if (existing.enabled) {
      return toStatus(existing, this.publicOrigin);
    }

    const enabled = await this.repository.setEnabled(raiderAccountId, true);

    return toStatus(enabled, this.publicOrigin);
  }

  async disable(raiderAccountId: string): Promise<CrafterShareStatus> {
    const existing = await this.repository.findByAccountId(raiderAccountId);

    if (!existing) {
      return toStatus(null, this.publicOrigin);
    }

    const disabled = await this.repository.setEnabled(raiderAccountId, false);

    return toStatus(disabled, this.publicOrigin);
  }

  async getPublicCard(token: string): Promise<PublicCrafterShareCard> {
    const record = await this.repository.findEnabledPublicRecord(token);

    if (!record) {
      throw new AppError(404, "This crafter card is not available.");
    }

    return mapPublicCrafterShareCard(record);
  }
}
