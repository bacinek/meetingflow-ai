"use client";

import { useState } from "react";

import { FollowUpDraft } from "@/components/FollowUpDraft";
import { ReviewForm } from "@/components/ReviewForm";
import { TransferPanel } from "@/components/TransferPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { WorkflowStageCard } from "@/components/WorkflowStageCard";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ANALYZE_MESSAGES } from "@/lib/analyze-messages";
import {
  hydrateAnalysis,
  toMeetingAnalysis,
  type HydratedMeetingAnalysis,
} from "@/lib/employees";
import { followUpSyncSnapshot } from "@/lib/follow-up-sync";
import { isReviewDirty, serializeReviewState } from "@/lib/review-dirty";
import type { FollowUpDraft as FollowUpDraftType, MeetingAnalysis } from "@/lib/schemas/meeting";

const STEP_SECTION_IDS: Record<number, string> = {
  1: "transcript-section",
  2: "transcript-section",
  3: "review-section",
  4: "transfer-section",
  5: "follow-up-section",
};

function applyHydratedAnalysis(
  result: MeetingAnalysis,
): {
  review: HydratedMeetingAnalysis;
  followUpDraft: FollowUpDraftType;
  syncSnapshot: string;
  dirtyBaseline: string;
} {
  const review = hydrateAnalysis(result);
  const followUpDraft = { ...result.followUpDraft };
  const meeting = toMeetingAnalysis(review);
  const syncSnapshot = followUpSyncSnapshot(meeting);
  const dirtyBaseline = serializeReviewState(review, followUpDraft);
  return { review, followUpDraft, syncSnapshot, dirtyBaseline };
}

export function MeetingWorkflow() {
  const [review, setReview] = useState<HydratedMeetingAnalysis | null>(null);
  const [followUpDraft, setFollowUpDraft] = useState<FollowUpDraftType>({
    subject: "",
    body: "",
  });
  const [followUpSyncSnapshot, setFollowUpSyncSnapshot] = useState("");
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [dirtyBaseline, setDirtyBaseline] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(
    null,
  );
  const [transferComplete, setTransferComplete] = useState(false);

  const analysisComplete = review !== null;
  const currentStep = analyzing
    ? 2
    : transferComplete
      ? 4
      : analysisComplete
        ? 3
        : 1;

  function scrollToStep(stepId: number) {
    const targetId = STEP_SECTION_IDS[stepId];
    if (!targetId) {
      return;
    }
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleReviewChange(next: HydratedMeetingAnalysis) {
    setReview(next);
    setStaleDismissed(false);
  }

  function handleSyncSnapshotUpdate(snapshot: string) {
    setFollowUpSyncSnapshot(snapshot);
    setStaleDismissed(false);
  }

  async function runAnalyze(transcript: string) {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    const payload = (await response.json()) as {
      analysis?: MeetingAnalysis;
      error?: string;
    };

    if (!response.ok || !payload.analysis) {
      throw new Error(payload.error ?? ANALYZE_MESSAGES.aiFailure);
    }

    const applied = applyHydratedAnalysis(payload.analysis);
    setReview(applied.review);
    setFollowUpDraft(applied.followUpDraft);
    setFollowUpSyncSnapshot(applied.syncSnapshot);
    setStaleDismissed(false);
    setDirtyBaseline(applied.dirtyBaseline);
    setTransferComplete(false);
  }

  async function handleAnalyzeRequest(transcript: string) {
    if (
      review &&
      isReviewDirty(review, followUpDraft, dirtyBaseline)
    ) {
      setPendingTranscript(transcript);
      setReanalyzeOpen(true);
      return;
    }

    await runAnalyze(transcript);
  }

  async function confirmReanalyze() {
    if (!pendingTranscript) {
      setReanalyzeOpen(false);
      return;
    }
    const transcript = pendingTranscript;
    setReanalyzeOpen(false);
    setPendingTranscript(null);
    setAnalyzing(true);
    try {
      await runAnalyze(transcript);
    } catch (error) {
      throw error;
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <WorkflowStepper
        currentStep={currentStep}
        analysisComplete={analysisComplete}
        onStepClick={scrollToStep}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <section id="transcript-section" aria-labelledby="transcript-section-title">
          <WorkflowStageCard
            step={1}
            title="Vnos transkripta"
            description="Prilepite transkript, naložite datoteko ali uporabite primer. Po uspešnem branju datoteke kliknite Analiziraj z AI."
            titleId="transcript-section-title"
          >
            {analysisComplete ? (
              <Alert className="mb-5 border-primary/25 bg-primary/5">
                <AlertTitle>Analiza končana</AlertTitle>
                <AlertDescription>{ANALYZE_MESSAGES.success}</AlertDescription>
              </Alert>
            ) : null}

            <TranscriptPanel
              analyzing={analyzing}
              onAnalyzingChange={setAnalyzing}
              onAnalyze={handleAnalyzeRequest}
            />
          </WorkflowStageCard>
        </section>

        {analysisComplete && review ? (
          <>
            <section id="review-section" aria-labelledby="review-section-title">
              <WorkflowStageCard
                step={3}
                title="Pregled in potrditev"
                description="Preverite in po potrebi popravite podatke pred prenosom v poslovni sistem."
                titleId="review-section-title"
              >
                <ReviewForm review={review} onChange={handleReviewChange} />
              </WorkflowStageCard>
            </section>

            <section
              id="transfer-section"
              aria-labelledby="transfer-section-title"
            >
              <WorkflowStageCard
                step={4}
                title="Prenos v poslovni sistem"
                description="Potrdite trenutne podatke in jih pošljite v interni poslovni sistem prek poslovnega API-ja."
                titleId="transfer-section-title"
              >
                <TransferPanel
                  review={review}
                  followUpDraft={followUpDraft}
                  onTransferSuccess={() => setTransferComplete(true)}
                />
              </WorkflowStageCard>
            </section>

            <section
              id="follow-up-section"
              aria-labelledby="follow-up-section-title"
            >
              <WorkflowStageCard
                step={5}
                title="Follow-up sporočilo"
                description="Osnutek follow-up e-pošte stranki na podlagi potrjenih podatkov."
                titleId="follow-up-section-title"
              >
                <FollowUpDraft
                  review={review}
                  draft={followUpDraft}
                  onDraftChange={setFollowUpDraft}
                  syncSnapshot={followUpSyncSnapshot}
                  staleDismissed={staleDismissed}
                  onStaleDismiss={() => setStaleDismissed(true)}
                  onSyncSnapshotUpdate={handleSyncSnapshotUpdate}
                />
              </WorkflowStageCard>
            </section>
          </>
        ) : null}
      </main>

      <Dialog open={reanalyzeOpen} onOpenChange={setReanalyzeOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Ponovna AI analiza</DialogTitle>
            <DialogDescription>
              Ponovna analiza bo zamenjala trenutni pregled in morebitne
              ročne popravke. Ali želite nadaljevati?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReanalyzeOpen(false);
                setPendingTranscript(null);
              }}
            >
              Prekliči
            </Button>
            <Button type="button" onClick={() => void confirmReanalyze()}>
              Potrdi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
