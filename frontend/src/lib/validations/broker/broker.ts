import type { ZodType } from "zod";
import { z } from "zod";


export type BrokerFormValues = {
  accountNumber: string; // MetaTrader login
  brokerName: string;    // Account name
  platform: string;      // mt4 | mt5
  server: string;       // MetaTrader server name
  password: string;      // MetaTrader password (investor or master)
  userId?: string;
  region?: string;
  maggic?: number;
};

export const brokerFormSchema = z.object({
  accountNumber: z.string().trim().min(1, "Required"),
  brokerName: z.string().trim().min(1, "Required"),
  platform: z.string().trim().min(1, "Required"),
  server: z.string().trim().min(1, "Required"),
  password: z.string().trim().min(1, "Required"),
});
