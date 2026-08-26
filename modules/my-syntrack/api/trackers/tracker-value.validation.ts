import { z } from "zod";

export const trackerDefinitionIdRouteParamSchema =
  z.string().trim().min(1);

export const trackerCharacterIdRouteParamSchema =
  z.string().trim().min(1);

export const trackerValueSetSchema =
  z.discriminatedUnion("valueType", [
    z
      .object({
        valueType: z.literal("BOOLEAN"),
        boolean: z.boolean()
      })
      .strict(),
    z
      .object({
        valueType: z.literal("PROGRESS"),
        current: z.coerce
          .number()
          .int(),
        total: z.coerce.number().int()
      })
      .strict(),
    z
      .object({
        valueType: z.literal("NUMBER"),
        number: z.coerce.number().int()
      })
      .strict(),
    z
      .object({
        valueType: z.literal("TEXT"),
        text: z.string()
      })
      .strict()
  ]);

export const trackerScopeQuerySchema =
  z.object({
    scopeKey: z
      .string()
      .trim()
      .min(1)
      .max(60),
    characterIds: z
      .union([
        z.string(),
        z.array(z.string())
      ])
      .transform((value) =>
        Array.isArray(value)
          ? value
          : [value]
      ),
    period: z
      .string()
      .trim()
      .min(1)
      .optional()
  });
