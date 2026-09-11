import { toMeetingAnalysis, type HydratedMeetingAnalysis } from "@/lib/employees";
import type { FollowUpDraft } from "@/lib/schemas/meeting";

export function serializeReviewState(
  review: HydratedMeetingAnalysis,
  followUpDraft: FollowUpDraft,
): string {
  return JSON.stringify({
    meeting: toMeetingAnalysis(review),
    followUpDraft,
  });
}

export function isReviewDirty(
  review: HydratedMeetingAnalysis,
  followUpDraft: FollowUpDraft,
  baselineSerialized: string,
): boolean {
  return serializeReviewState(review, followUpDraft) !== baselineSerialized;
}
