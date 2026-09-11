import { toMeetingAnalysis, type HydratedMeetingAnalysis } from "@/lib/employees";
import type { FollowUpDraft, TransferRequest } from "@/lib/schemas/meeting";
import {
  deriveUncertaintiesFromReview,
  mergeUncertainties,
} from "@/lib/uncertainties";

export function buildTransferPayload(
  review: HydratedMeetingAnalysis,
  followUpDraft: FollowUpDraft,
  simulateFailure: boolean,
): TransferRequest {
  const base = toMeetingAnalysis(review);
  const uncertainties = mergeUncertainties(
    review.uncertainties,
    deriveUncertaintiesFromReview(review),
  );

  return {
    ...base,
    uncertainties,
    followUpDraft,
    ...(simulateFailure ? { simulateFailure: true } : {}),
  };
}
