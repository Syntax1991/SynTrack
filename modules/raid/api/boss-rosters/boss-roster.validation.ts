import { z } from "zod";

export const raidBossStatusSchema =
  z.enum([
    "CONFIRMED",
    "TENTATIVE",
    "BENCH"
  ]);

export const raidBossInputSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(120),

      sortOrder: z.coerce
        .number()
        .int()
        .min(0)
        .max(999)
        .default(0)
    })
    .strict();

export const raidBossRosterEntryInputSchema =
  z
    .object({
      status:
        raidBossStatusSchema
    })
    .strict();

export const raidBossRosterEntrySpecInputSchema =
  z
    .object({
      specId: z
        .number()
        .int()
        .positive()
        .nullable()
    })
    .strict();

export const raidEventIdParamSchema =
  z.string().min(1);

export const raidBossIdSchema =
  z.string().min(1);

export const raidBossMemberIdSchema =
  z.string().min(1);

export const raidSetupIdParamSchema =
  z.string().min(1);
