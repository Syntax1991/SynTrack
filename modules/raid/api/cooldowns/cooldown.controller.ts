import type {
  RequestHandler
} from "express";
import { RaidCooldownService } from "./cooldown.service.js";
import {
  raidCooldownAssignmentIdSchema,
  raidCooldownAssignmentInputSchema,
  raidCooldownBossIdSchema,
  raidCooldownPlanMemberIdParamSchema,
  raidCooldownPlanMemberInputSchema,
  raidCooldownSetupIdParamSchema
} from "./cooldown.validation.js";

/**
 * The Cooldown Plan — plan members and assignments — always Setup+Boss
 * scoped. Encounter facts (casts, phases, fight duration) are handled
 * by RaidCooldownEncounterController instead.
 */
export class RaidCooldownController {
  constructor(
    private readonly service:
      RaidCooldownService
  ) {}

  listForSetup: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidCooldownSetupIdParamSchema.parse(
        request.params.setupId
      );

    const assignments =
      await this.service.listForSetup(
        setupId
      );

    response.json({
      items: assignments,
      total: assignments.length
    });
  };

  createAssignment: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidCooldownSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const input =
      raidCooldownAssignmentInputSchema.parse(
        request.body
      );

    const assignment =
      await this.service.createAssignment(
        setupId,
        bossId,
        {
          ...input,
          spellId:
            input.spellId ??
            null,
          abilityIcon:
            input.abilityIcon ??
            null,
          phaseLabel:
            input.phaseLabel ??
            null,
          timestampSeconds:
            input.timestampSeconds ??
            null
        }
      );

    response
      .status(201)
      .json(assignment);
  };

  updateAssignment: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidCooldownSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const assignmentId =
      raidCooldownAssignmentIdSchema.parse(
        request.params.assignmentId
      );

    const input =
      raidCooldownAssignmentInputSchema.parse(
        request.body
      );

    const assignment =
      await this.service.updateAssignment(
        setupId,
        bossId,
        assignmentId,
        {
          ...input,
          spellId:
            input.spellId ??
            null,
          abilityIcon:
            input.abilityIcon ??
            null,
          phaseLabel:
            input.phaseLabel ??
            null,
          timestampSeconds:
            input.timestampSeconds ??
            null
        }
      );

    response.json(assignment);
  };

  deleteAssignment: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidCooldownSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const assignmentId =
      raidCooldownAssignmentIdSchema.parse(
        request.params.assignmentId
      );

    await this.service.deleteAssignment(
      setupId,
      bossId,
      assignmentId
    );

    response.status(204).send();
  };

  listPlanMembers: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidCooldownSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const members =
      await this.service.listPlanMembers(
        setupId,
        bossId
      );

    response.json({
      items: members,
      total: members.length
    });
  };

  addPlanMember: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidCooldownSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const input =
      raidCooldownPlanMemberInputSchema.parse(
        request.body
      );

    const planMember =
      await this.service.addPlanMember(
        setupId,
        bossId,
        input.memberId
      );

    response
      .status(201)
      .json(planMember);
  };

  removePlanMember: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidCooldownSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const memberId =
      raidCooldownPlanMemberIdParamSchema.parse(
        request.params.memberId
      );

    await this.service.removePlanMember(
      setupId,
      bossId,
      memberId
    );

    response.status(204).send();
  };
}
