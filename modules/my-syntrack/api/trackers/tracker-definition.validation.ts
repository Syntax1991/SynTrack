import { z } from "zod";

export const trackerScopeKeyParamSchema =
  z.string().trim().min(1).max(60);

export const trackerValueTypeSchema =
  z.enum([
    "BOOLEAN",
    "PROGRESS",
    "NUMBER",
    "TEXT"
  ]);

export const trackerResetBehaviorSchema =
  z.enum([
    "WEEKLY",
    "SEASONAL",
    "PERMANENT"
  ]);

export const trackerDefinitionCreateSchema =
  z
    .object({
      scopeKey: z
        .string()
        .trim()
        .min(1)
        .max(60),
      key: z
        .string()
        .trim()
        .min(1)
        .max(80),
      name: z
        .string()
        .trim()
        .min(1)
        .max(120),
      valueType: trackerValueTypeSchema,
      resetBehavior:
        trackerResetBehaviorSchema,
      category: z
        .string()
        .trim()
        .max(60)
        .optional(),
      sortOrder: z.coerce
        .number()
        .int()
        .optional(),
      isPinned: z.boolean().optional()
    })
    .strict();

export const trackerDefinitionMetadataUpdateSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .optional(),
      category: z
        .string()
        .trim()
        .max(60)
        .nullable()
        .optional(),
      sortOrder: z.coerce
        .number()
        .int()
        .optional(),
      isPinned: z.boolean().optional(),
      enabled: z.boolean().optional()
    })
    .strict();

export const trackerDefinitionIdParamSchema =
  z.string().trim().min(1);
