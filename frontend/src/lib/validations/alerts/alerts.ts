import { z } from "zod";

export const createAlertSchema = z.object({
  type: z.enum(["PRICE", "BEHAVIOR", "SESSION"]),
  symbol: z.string().optional(),
  triggerValue: z.number().optional(),
  message: z.string().optional(),
  active: z.boolean().default(true),
});

export const updateAlertSchema = createAlertSchema.partial();

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
