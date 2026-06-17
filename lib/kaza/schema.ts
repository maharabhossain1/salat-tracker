import { z } from 'zod';

export const targetsSchema = z.object({
  fajr: z.number().int().min(0).max(1_000_000),
  dhuhr: z.number().int().min(0).max(1_000_000),
  asr: z.number().int().min(0).max(1_000_000),
  maghrib: z.number().int().min(0).max(1_000_000),
  isha: z.number().int().min(0).max(1_000_000),
});

export type TargetsInput = z.infer<typeof targetsSchema>;
