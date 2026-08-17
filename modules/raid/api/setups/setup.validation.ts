import { z } from "zod";

export const raidSetupEventIdParamSchema = z.string().min(1);

export const raidSetupIdParamSchema = z.string().min(1);

export const raidSetupMemberIdParamSchema = z.string().min(1);

export const raidSetupMembersInputSchema = z
  .object({
    memberIds: z.array(z.string().min(1)).min(1).max(100)
  })
  .strict();

export const raidSetupCreateInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80)
  })
  .strict();
