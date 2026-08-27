import { z } from "zod";

export const trackerScopeProfileCreateSchema =
  z
    .object({
      key: z
        .string()
        .trim()
        .min(1)
        .max(60),
      name: z
        .string()
        .trim()
        .min(1)
        .max(120)
    })
    .strict();

export const trackerScopeProfileKeyParamSchema =
  z.string().trim().min(1).max(60);
