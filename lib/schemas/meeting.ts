import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function nullIfEmpty(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return typeof value === "string" ? value : null;
}

const nullableText = z.preprocess(nullIfEmpty, z.string().nullable());

const deadlineDateField = z.preprocess(
  nullIfEmpty,
  z
    .string()
    .nullable()
    .refine(
      (value) => value === null || ISO_DATE_REGEX.test(value),
      { message: "deadlineDate must be YYYY-MM-DD or null" },
    ),
);

export const followUpDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const actionItemSchema = z.object({
  task: z.string(),
  responsiblePerson: nullableText,
  deadlineLabel: nullableText,
  deadlineDate: deadlineDateField,
});

/** Schema passed to OpenAI Structured Outputs (strict json_schema). */
export const actionItemStructuredSchema = z.object({
  task: z.string(),
  responsiblePerson: z.string().nullable(),
  deadlineLabel: z.string().nullable(),
  deadlineDate: z.string().nullable(),
});

export const meetingAnalysisStructuredSchema = z.object({
  clientName: z.string().nullable(),
  meetingTopic: z.string().nullable(),
  summary: z.string(),
  keyInformation: z.array(z.string()),
  clientRequirements: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(actionItemStructuredSchema),
  nextMeeting: z.string().nullable(),
  uncertainties: z.array(z.string()),
  followUpDraft: followUpDraftSchema,
});

/** Second gate after OpenAI parse — normalizes empty strings and validates dates. */
export const meetingAnalysisSchema = z.object({
  clientName: nullableText,
  meetingTopic: nullableText,
  summary: z.string(),
  keyInformation: z.array(z.string()),
  clientRequirements: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(actionItemSchema),
  nextMeeting: nullableText,
  uncertainties: z.array(z.string()),
  followUpDraft: followUpDraftSchema,
});

export const analyzeRequestSchema = z.object({
  transcript: z.string(),
});

/** Confirmed meeting JSON for POST /api/follow-up (and later transfer). */
export const followUpRequestSchema = meetingAnalysisSchema;

/** Confirmed meeting JSON for POST /api/business-system/meetings. */
export const transferRequestSchema = meetingAnalysisSchema.extend({
  simulateFailure: z.boolean().optional(),
});

/** Persisted action item returned by GET /api/business-system/meetings. */
export const persistedActionItemSchema = actionItemSchema;

/** Persisted meeting returned by GET /api/business-system/meetings. */
export const meetingRecordSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  clientName: nullableText,
  meetingTopic: nullableText,
  summary: z.string(),
  keyInformation: z.array(z.string()),
  clientRequirements: z.array(z.string()),
  decisions: z.array(z.string()),
  nextMeeting: nullableText,
  uncertainties: z.array(z.string()),
  followUpSubject: z.string(),
  followUpBody: z.string(),
  actionItems: z.array(persistedActionItemSchema),
});

export const meetingsListResponseSchema = z.object({
  meetings: z.array(meetingRecordSchema),
});

export type FollowUpDraft = z.infer<typeof followUpDraftSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;
export type MeetingAnalysis = z.infer<typeof meetingAnalysisSchema>;
export type FollowUpRequest = z.infer<typeof followUpRequestSchema>;
export type TransferRequest = z.infer<typeof transferRequestSchema>;
export type MeetingRecord = z.infer<typeof meetingRecordSchema>;
export type MeetingsListResponse = z.infer<typeof meetingsListResponseSchema>;
