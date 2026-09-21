import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { isAdminIdentity } from "./admin-allowlist.js";
import type { AdminUsersService } from "./admin-users.service.js";
import type { RaiderSessionGuard } from "../raider-auth/raider-auth.types.js";
import type { RaiderAuthRepository } from "../raider-auth/raider-auth.repository.js";

const idSchema = z.string().min(1);
const deleteBodySchema = z.object({
  confirmBattleTag: z.string().min(1)
});

export class AdminUsersController {
  constructor(
    private readonly service: AdminUsersService,
    private readonly raiderAuth: RaiderSessionGuard,
    private readonly accounts: RaiderAuthRepository
  ) {}

  list: RequestHandler = async (request, response) => {
    await this.requireAdmin(request);
    response.json(await this.service.list());
  };

  approve: RequestHandler = async (request, response) => {
    await this.requireAdmin(request);
    response.json(await this.service.approve(this.accountId(request)));
  };

  disable: RequestHandler = async (request, response) => {
    await this.requireAdmin(request);
    response.json(await this.service.disable(this.accountId(request)));
  };

  enable: RequestHandler = async (request, response) => {
    await this.requireAdmin(request);
    response.json(await this.service.enable(this.accountId(request)));
  };

  revokeShare: RequestHandler = async (request, response) => {
    await this.requireAdmin(request);
    response.json(await this.service.revokeShare(this.accountId(request)));
  };

  remove: RequestHandler = async (request, response) => {
    await this.requireAdmin(request);
    const parsed = deleteBodySchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(
        400,
        "Type the BattleTag to confirm deleting this account."
      );
    }

    response.json(
      await this.service.remove(
        this.accountId(request),
        parsed.data.confirmBattleTag
      )
    );
  };

  private accountId(request: { params: { id?: string } }): string {
    const parsed = idSchema.safeParse(request.params.id);

    if (!parsed.success) {
      throw new AppError(404, "Account not found.");
    }

    return parsed.data;
  }

  private async requireAdmin(request: Parameters<RequestHandler>[0]) {
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);
    const account = await this.accounts.findAccountById(
      session.raiderAccountId
    );

    if (!account || !isAdminIdentity(account)) {
      throw new AppError(403, "Admin access required.");
    }
  }
}
