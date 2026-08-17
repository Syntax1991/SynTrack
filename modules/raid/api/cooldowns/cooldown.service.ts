import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidSetupRepository } from "../setups/setup.repository.js";
import { RaidCooldownRepository } from "./cooldown.repository.js";
import type { RaidCooldownAssignmentInput } from "./cooldown.types.js";

/**
 * The Cooldown Plan itself: plan participants and assignments, always
 * scoped by Setup+Boss together — a Setup and Boss from different
 * RaidEvents can never be combined, and neither can an assignment
 * belonging to a different Setup than the one in the route. Encounter
 * facts (casts, phases, fight duration, WCL sync) live in
 * RaidCooldownEncounterService instead — those describe the fight
 * itself, not any particular composition, so they stay boss-only.
 */
export class RaidCooldownService {
  constructor(
    private readonly repository:
      RaidCooldownRepository,

    private readonly setupRepository:
      RaidSetupRepository,

    private readonly verification:
      GuildVerificationGuard
  ) {}

  listForSetup(setupId: string) {
    return this.repository.findForSetup(
      setupId
    );
  }

  async createAssignment(
    token: string,
    setupId: string,
    bossId: string,
    input: RaidCooldownAssignmentInput
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    const member =
      await this.repository.findMemberById(
        input.memberId
      );

    if (!member) {
      throw new AppError(
        404,
        "Gildenmitglied nicht gefunden."
      );
    }

    return this.repository.createAssignment(
      setup.id,
      boss.id,
      this.normalize(input)
    );
  }

  async updateAssignment(
    token: string,
    setupId: string,
    bossId: string,
    assignmentId: string,
    input: RaidCooldownAssignmentInput
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    const assignment =
      await this.requireOwnedAssignment(
        assignmentId,
        setup.id,
        boss.id
      );

    const member =
      await this.repository.findMemberById(
        input.memberId
      );

    if (!member) {
      throw new AppError(
        404,
        "Gildenmitglied nicht gefunden."
      );
    }

    return this.repository.updateAssignment(
      assignment.id,
      this.normalize(input)
    );
  }

  async deleteAssignment(
    token: string,
    setupId: string,
    bossId: string,
    assignmentId: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    const assignment =
      await this.requireOwnedAssignment(
        assignmentId,
        setup.id,
        boss.id
      );

    await this.repository.deleteAssignment(
      assignment.id
    );
  }

  listPlanMembers(
    setupId: string,
    bossId: string
  ) {
    return this.repository.findPlanMembersForSetupAndBoss(
      setupId,
      bossId
    );
  }

  async addPlanMember(
    token: string,
    setupId: string,
    bossId: string,
    memberId: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    const member =
      await this.repository.findMemberById(
        memberId
      );

    if (!member) {
      throw new AppError(
        404,
        "Gildenmitglied nicht gefunden."
      );
    }

    return this.repository.addPlanMember(
      setup.id,
      boss.id,
      memberId
    );
  }

  /**
   * A plan member with real assignments can never be silently
   * removed — that would orphan/hide their planning work with no
   * cascade-delete to blame, since RaidCooldownAssignment has no FK
   * to this table at all. The officer has to clear the assignments
   * first; this is the explicit, separate operation that requires.
   * The count is scoped to the exact same Setup+Boss, so an
   * assignment under a different Setup can never block removal here.
   */
  async removePlanMember(
    token: string,
    setupId: string,
    bossId: string,
    memberId: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const { boss, setup } =
      await this.requireConsistentBossAndSetup(
        bossId,
        setupId
      );

    const assignmentCount =
      await this.repository.countAssignmentsForSetupBossMember(
        setup.id,
        boss.id,
        memberId
      );

    if (assignmentCount > 0) {
      throw new AppError(
        409,
        "Dieser Spieler hat noch geplante Cooldowns für diesen Boss. Entferne zuerst die Zuweisungen, bevor du ihn aus dem Zeitplan entfernst."
      );
    }

    await this.repository.deletePlanMember(
      setup.id,
      boss.id,
      memberId
    );
  }

  /**
   * The same invariant BossRosterService.setEntry/clearEntry already
   * enforce for boss-lineup writes: a caller must never be able to
   * combine a Setup and a Boss from different RaidEvents. Reused here
   * for every Cooldown Plan read/write that takes both ids, not just
   * mutations — a Setup+Boss pair from unrelated events shouldn't
   * even be allowed to LIST planning state together.
   */
  private async requireConsistentBossAndSetup(
    bossId: string,
    setupId: string
  ) {
    const [boss, setup] =
      await Promise.all([
        this.repository.findBossById(
          bossId
        ),
        this.setupRepository.findSetupById(
          setupId
        )
      ]);

    if (!boss) {
      throw new AppError(
        404,
        "Boss nicht gefunden."
      );
    }

    if (!setup) {
      throw new AppError(
        404,
        "Setup nicht gefunden."
      );
    }

    if (
      boss.raidEventId !==
      setup.raidEventId
    ) {
      throw new AppError(
        400,
        "Boss und Setup gehören zu unterschiedlichen Terminen."
      );
    }

    return { boss, setup };
  }

  /**
   * Confirms the assignment being updated/deleted actually belongs to
   * the exact Setup+Boss in the route — never just any assignment by
   * id, which would let a caller mutate another Setup's planning data
   * simply by knowing an assignment id.
   */
  private async requireOwnedAssignment(
    assignmentId: string,
    setupId: string,
    bossId: string
  ) {
    const assignment =
      await this.repository.findAssignmentById(
        assignmentId
      );

    if (
      !assignment ||
      assignment.setupId !== setupId ||
      assignment.bossId !== bossId
    ) {
      throw new AppError(
        404,
        "Cooldown-Zuweisung nicht gefunden."
      );
    }

    return assignment;
  }

  private normalize(
    input: RaidCooldownAssignmentInput
  ): RaidCooldownAssignmentInput {
    return {
      ...input,
      abilityName:
        input.abilityName.trim(),
      phaseLabel:
        input.phaseLabel?.trim() ||
        null
    };
  }
}
