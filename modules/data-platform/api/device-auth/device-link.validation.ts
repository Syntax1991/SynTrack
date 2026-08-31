import { z } from "zod";

export const deviceLinkCreateSchema =
  z
    .object({
      clientName: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .optional()
    })
    .strict();

export const deviceLinkUserCodeParamSchema =
  z.string().trim().min(1).max(20);

export const deviceLinkStatusSchema =
  z
    .object({
      deviceCode: z
        .string()
        .trim()
        .min(1)
        .max(200)
    })
    .strict();

export const deviceCredentialIdParamSchema =
  z.string().trim().min(1);

export const deviceConnectionStartSchema =
  z
    .object({
      deviceName: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .optional()
    })
    .strict();

export const deviceConnectionPollSchema =
  z
    .object({
      pollToken: z
        .string()
        .trim()
        .min(1)
        .max(200)
    })
    .strict();

export const deviceConnectionTokenQuerySchema =
  z.string().trim().min(1).max(200);

export const deviceConnectionBindSchema =
  z
    .object({
      token: z
        .string()
        .trim()
        .min(1)
        .max(200)
    })
    .strict();
