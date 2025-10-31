import type { ZodType } from "zod";
import { z } from "zod";


export type BrokerFormValues = {
  accountNumber: string;
  brokerName: string;
  platform: string;
  server: string;
  password: string;
  region: string;
};

export const brokerFormSchema = z.object({
  accountNumber: z.string().trim().min(1, "Required"),
  brokerName: z.string().trim().min(1, "Required"),
  platform: z.string().trim().min(1, "Required"),
  server: z.string().trim().min(1, "Required"),
  password: z.string().trim().min(1, "Required"),
  region: z.string().trim().min(1, "Required"),
});
