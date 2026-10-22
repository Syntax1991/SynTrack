import { z } from "zod";
import { BONUS_ROLL_OUTCOMES } from "./bonus-roll.types.js";

const journalId = z.coerce.number().int().positive();

const note = z.string().trim().max(200).transform((value) => (value === "" ? null : value));

export const bonusRollIdParamSchema = z.string().trim().min(1);

export const journalIdParamSchema = journalId;

export const bonusRollCreateSchema = z
  .object({
    characterId: z.string().trim().min(1),
    instanceId: journalId,
    encounterId: journalId,
    targetItemId: journalId.nullable().optional(),
    note: note.nullable().optional()
  })
  .strict();

export const bonusRollUpdateSchema = z
  .object({
    targetItemId: journalId.nullable().optional(),
    note: note.nullable().optional()
  })
  .strict();

export const bonusRollResultSchema = z
  .object({
    outcome: z.enum(BONUS_ROLL_OUTCOMES),
    receivedItemId: journalId.nullable().optional(),
    rolledAt: z.coerce.date().optional()
  })
  .strict()
  .refine(
    (input) => input.outcome !== "ITEM" || typeof input.receivedItemId === "number",
    { message: "Choose the received item for an item result.", path: ["receivedItemId"] }
  );

export type BonusRollCreateInput = z.infer<typeof bonusRollCreateSchema>;
export type BonusRollUpdateInput = z.infer<typeof bonusRollUpdateSchema>;
export type BonusRollResultInput = z.infer<typeof bonusRollResultSchema>;
