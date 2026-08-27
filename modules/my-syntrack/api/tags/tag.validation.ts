import { z } from "zod";

export const tagCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    color: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .optional()
  })
  .strict();

export const tagUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .optional(),
    color: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .nullable()
      .optional(),
    sortOrder: z.coerce
      .number()
      .int()
      .optional()
  })
  .strict();

export const tagIdParamSchema =
  z.string().trim().min(1);

export const characterIdParamSchema =
  z.string().trim().min(1);
