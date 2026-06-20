import { z } from "zod";

const nullableNumber = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}, z.number().nullable());

const nullableInteger = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : value;
}, z.number().int().nullable());

export const snapshotSchema = z.object({
  snapshot_id: z.string().optional(),
  elder_id: z.string().min(1),
  date: z.string().min(8),
  data_source: z.string().min(1).default("Manual Demo"),
  heart_rate_avg: nullableNumber.optional().default(null),
  resting_heart_rate: nullableNumber.optional().default(null),
  steps: nullableInteger.optional().default(null),
  active_minutes: nullableNumber.optional().default(null),
  sleep_duration: nullableNumber.optional().default(null),
  wear_time_hours: nullableNumber.optional().default(null),
  data_quality: z.coerce.number().min(0).max(100),
  created_at: z.string().optional(),
});

export const eventSchema = z.object({
  event_id: z.string().optional(),
  elder_id: z.string().min(1),
  event_type: z.string().min(1),
  timestamp: z.string().optional(),
  source: z.string().min(1).default("demo"),
  raw_text: z.string().nullable().optional(),
  payload: z.record(z.unknown()).optional().default({}),
  created_at: z.string().optional(),
});

export const taskPatchSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  handled_by: z.string().nullable().optional(),
  handled_note: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
});

export const agentAnalyzeSchema = z.object({
  elder_profile: z.record(z.unknown()),
  daily_snapshot: z.record(z.unknown()),
  baseline: z.record(z.unknown()).optional().default({}),
  events: z.array(z.record(z.unknown())).optional().default([]),
  risk_result: z.record(z.unknown()),
  source_event_id: z.string().nullable().optional(),
});
