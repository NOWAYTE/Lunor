import { z } from "zod";

export const createJournalEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Journal content required"),
  tradeId: z.string().optional(),
  voiceUrl: z.string().url().optional(),
  transcript: z.string().optional(),
  sentiment: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateJournalEntrySchema = createJournalEntrySchema.partial();

export const createEmotionRecordSchema = z.object({
  emotion: z.enum(["CALM", "FEAR", "GREED", "REVENGE", "CONFIDENCE", "ANXIETY"]),
  intensity: z.number().min(1).max(10, "Intensity must be 1-10"),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
export type CreateEmotionRecordInput = z.infer<typeof createEmotionRecordSchema>;
