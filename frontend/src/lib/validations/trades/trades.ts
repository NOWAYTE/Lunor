import { z } from "zod";

export const createTradeSchema = z.object({
  brokerAccountId: z.string().min(1, "Broker account required"),
  symbol: z.string().min(1, "Symbol required"),
  tradeType: z.enum(["BUY", "SELL"], { message: "Trade type must be BUY or SELL" }),
  lotSize: z.number().positive("Lot size must be positive"),
  entryPrice: z.number().positive("Entry price must be positive"),
  exitPrice: z.number().positive("Exit price must be positive"),
  openTime: z.coerce.date(),
  closeTime: z.coerce.date(),
  session: z.enum(["ASIA", "LONDON", "NEWYORK"]).optional(),
  strategyTag: z.string().optional(),
  riskReward: z.number().optional(),
  notes: z.string().optional(),
});

export const updateTradeSchema = createTradeSchema.partial();

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
