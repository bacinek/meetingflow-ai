import type { MeetingAnalysis } from "@/lib/schemas/meeting";

/** Fields that invalidate the follow-up draft when changed (§9.11). */
export function followUpSyncSnapshot(review: MeetingAnalysis): string {
  return JSON.stringify({
    clientRequirements: review.clientRequirements,
    nextMeeting: review.nextMeeting,
    actionItems: review.actionItems.map((item) => ({
      responsiblePerson: item.responsiblePerson,
      deadlineLabel: item.deadlineLabel,
      deadlineDate: item.deadlineDate,
    })),
  });
}

export function isFollowUpOutOfSync(
  review: MeetingAnalysis,
  snapshot: string,
): boolean {
  return followUpSyncSnapshot(review) !== snapshot;
}
