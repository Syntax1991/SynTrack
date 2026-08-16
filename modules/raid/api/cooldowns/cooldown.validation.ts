import { z } from "zod";

export const raidCooldownAssignmentInputSchema =
  z
    .object({
      memberId: z
        .string()
        .min(1),

      abilityName: z
        .string()
        .trim()
        .min(1)
        .max(80),

      spellId: z.coerce
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

      abilityIcon: z
        .string()
        .trim()
        .url()
        .nullable()
        .optional(),

      phaseLabel: z
        .string()
        .trim()
        .max(60)
        .nullable()
        .optional(),

      timestampSeconds: z.coerce
        .number()
        .int()
        .min(0)
        .max(7200)
        .nullable()
        .optional(),

      sortOrder: z.coerce
        .number()
        .int()
        .min(0)
        .max(999)
        .default(0)
    })
    .strict();

export const raidBossPhaseMarkerInputSchema =
  z
    .object({
      label: z
        .string()
        .trim()
        .min(1)
        .max(60),

      startSeconds: z.coerce
        .number()
        .int()
        .min(0)
        .max(7200),

      sortOrder: z.coerce
        .number()
        .int()
        .min(0)
        .max(999)
        .default(0)
    })
    .strict();

export const raidBossFightDurationInputSchema =
  z
    .object({
      fightDurationSeconds: z.coerce
        .number()
        .int()
        .min(0)
        .max(7200)
        .nullable()
    })
    .strict();

export const raidCooldownSetupIdParamSchema =
  z.string().min(1);

export const raidCooldownBossIdSchema =
  z.string().min(1);

export const raidCooldownAssignmentIdSchema =
  z.string().min(1);

export const raidBossPhaseMarkerIdSchema =
  z.string().min(1);

export const raidCooldownPlanMemberInputSchema =
  z
    .object({
      memberId: z
        .string()
        .min(1)
    })
    .strict();

export const raidCooldownPlanMemberIdParamSchema =
  z.string().min(1);
