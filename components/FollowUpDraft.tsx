"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toMeetingAnalysis, type HydratedMeetingAnalysis } from "@/lib/employees";
import { FOLLOW_UP_MESSAGES } from "@/lib/follow-up-messages";
import {
  followUpSyncSnapshot,
  isFollowUpOutOfSync,
} from "@/lib/follow-up-sync";
import type { FollowUpDraft as FollowUpDraftType } from "@/lib/schemas/meeting";

type FollowUpDraftProps = {
  review: HydratedMeetingAnalysis;
  draft: FollowUpDraftType;
  onDraftChange: (draft: FollowUpDraftType) => void;
  syncSnapshot: string;
  staleDismissed: boolean;
  onStaleDismiss: () => void;
  onSyncSnapshotUpdate: (snapshot: string) => void;
};

function buildMailtoUrl(subject: string, body: string): string {
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:?${params.toString()}`;
}

export function FollowUpDraft({
  review,
  draft,
  onDraftChange,
  syncSnapshot,
  staleDismissed,
  onStaleDismiss,
  onSyncSnapshotUpdate,
}: FollowUpDraftProps) {
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const meetingPayload = toMeetingAnalysis(review);
  const outOfSync = isFollowUpOutOfSync(meetingPayload, syncSnapshot);
  const actionsLocked = outOfSync && !staleDismissed;

  async function handleRegenerate() {
    setError(null);
    setRegenerating(true);
    try {
      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingPayload),
      });

      const payload = (await response.json()) as {
        subject?: string;
        body?: string;
        error?: string;
      };

      if (!response.ok || !payload.subject || payload.body === undefined) {
        setError(payload.error ?? FOLLOW_UP_MESSAGES.failure);
        return;
      }

      onDraftChange({ subject: payload.subject, body: payload.body });
      onSyncSnapshotUpdate(followUpSyncSnapshot(meetingPayload));
    } catch {
      setError(FOLLOW_UP_MESSAGES.failure);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopy() {
    const text = `Zadeva: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Sporočilo je kopirano v odložišče.");
    } catch {
      setCopyMessage("Kopiranje ni uspelo.");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        E-pošta se iz te aplikacije nikoli ne pošlje samodejno. Spodaj je le
        osnutek za ročno pošiljanje.
      </p>

      {outOfSync && !staleDismissed ? (
        <Alert>
          <AlertTitle>Osnutek ni usklajen</AlertTitle>
          <AlertDescription>
            Spremenili ste odgovorno osebo, rok, zahtevo stranke ali naslednji
            sestanek. Posodobite follow-up ali uporabite trenutni osnutek.
          </AlertDescription>
        </Alert>
      ) : null}

      {outOfSync && staleDismissed ? (
        <Alert>
          <AlertTitle>Osnutek morda ni usklajen</AlertTitle>
          <AlertDescription>
            Kopiranje in odprtje v e-pošti sta omogočena, vendar osnutek morda
            ne odraža zadnjih sprememb v pregledu.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Napaka</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {copyMessage ? (
        <Alert>
          <AlertDescription>{copyMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="follow-up-subject">Zadeva</Label>
        <Textarea
          id="follow-up-subject"
          value={draft.subject}
          onChange={(event) =>
            onDraftChange({ ...draft, subject: event.target.value })
          }
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="follow-up-body">Telo sporočila</Label>
        <Textarea
          id="follow-up-body"
          value={draft.body}
          onChange={(event) =>
            onDraftChange({ ...draft, body: event.target.value })
          }
          rows={10}
          className="min-h-48"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          disabled={actionsLocked}
          onClick={handleCopy}
        >
          Kopiraj sporočilo
        </Button>
        <a
          className={cn(
            buttonVariants({ variant: "outline" }),
            actionsLocked && "pointer-events-none opacity-50",
          )}
          href={
            actionsLocked
              ? undefined
              : buildMailtoUrl(draft.subject, draft.body)
          }
          aria-disabled={actionsLocked}
        >
          Odpri v e-pošti
        </a>
        <Button
          type="button"
          disabled={regenerating}
          onClick={handleRegenerate}
        >
          {regenerating ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Posodobi follow-up
        </Button>
        {outOfSync && !staleDismissed ? (
          <Button type="button" variant="secondary" onClick={onStaleDismiss}>
            Uporabi trenutni osnutek
          </Button>
        ) : null}
      </div>
    </div>
  );
}
