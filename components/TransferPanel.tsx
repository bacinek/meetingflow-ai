"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { buildTransferPayload } from "@/lib/build-transfer-payload";
import { type HydratedMeetingAnalysis } from "@/lib/employees";
import { TRANSFER_MESSAGES } from "@/lib/transfer-messages";
import type { FollowUpDraft as FollowUpDraftType } from "@/lib/schemas/meeting";
import { cn } from "@/lib/utils";

type TransferPanelProps = {
  review: HydratedMeetingAnalysis;
  followUpDraft: FollowUpDraftType;
  onTransferSuccess?: () => void;
};

type TransferState = "idle" | "submitting" | "error" | "success";

function formatOptional(value: string | null): string {
  if (value === null || value.trim() === "") {
    return "Ni določeno";
  }
  return value.trim();
}

export function TransferPanel({
  review,
  followUpDraft,
  onTransferSuccess,
}: TransferPanelProps) {
  const [transferState, setTransferState] = useState<TransferState>("idle");
  const [showFailureAlert, setShowFailureAlert] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const actionItemCount = review.actionItems.length;
  const clientLabel = formatOptional(review.clientName);
  const nextMeetingLabel = formatOptional(review.nextMeeting);

  async function executeTransfer() {
    setTransferState("submitting");
    const payload = buildTransferPayload(
      review,
      followUpDraft,
      simulateFailure,
    );

    try {
      const response = await fetch("/api/business-system/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as {
        meetingId?: string;
        error?: string;
      };

      if (!response.ok) {
        setTransferState("error");
        setShowFailureAlert(true);
        return;
      }

      if (!body.meetingId) {
        setTransferState("error");
        setShowFailureAlert(true);
        return;
      }

      setTransferState("success");
      setShowFailureAlert(false);
      onTransferSuccess?.();
    } catch {
      setTransferState("error");
      setShowFailureAlert(true);
    }
  }

  function handlePrimaryClick() {
    if (transferState === "error") {
      return;
    }
    setConfirmOpen(true);
  }

  function handleConfirmTransfer() {
    setConfirmOpen(false);
    void executeTransfer();
  }

  function handleRetry() {
    void executeTransfer();
  }

  const primaryDisabled =
    transferState === "submitting" || transferState === "error";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">Demo nastavitve</p>
          <Badge variant="outline">Samo za demo</Badge>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="simulate-failure" className="text-sm font-normal">
            Simuliraj napako API-ja
          </Label>
          <Switch
            id="simulate-failure"
            checked={simulateFailure}
            onCheckedChange={setSimulateFailure}
            disabled={transferState === "submitting"}
          />
        </div>
      </div>

      <Separator />

      {transferState === "success" ? (
        <Alert className="border-primary/25 bg-primary/5">
          <AlertTitle>Prenos uspel</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{TRANSFER_MESSAGES.success}</p>
            <Link
              href="/business-system"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Odpri poslovni sistem
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {showFailureAlert && transferState !== "success" ? (
        <Alert variant="destructive">
          <AlertTitle>Prenos ni uspel</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{TRANSFER_MESSAGES.failure}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={transferState === "submitting"}
            >
              {transferState === "submitting" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Poskušam znova …
                </>
              ) : (
                "Poskusi znova"
              )}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handlePrimaryClick}
          disabled={primaryDisabled}
        >
          {transferState === "submitting" ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Prenašam …
            </>
          ) : (
            "Potrdi in prenesi v poslovni sistem"
          )}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Potrditev prenosa</DialogTitle>
            <DialogDescription>
              Preverite povzetek pred pošiljanjem v interni poslovni sistem.
            </DialogDescription>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Stranka:</span>{" "}
                {clientLabel}
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Število nalog:
                </span>{" "}
                {actionItemCount}
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Naslednji sestanek:
                </span>{" "}
                {nextMeetingLabel}
              </li>
            </ul>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Prekliči
            </Button>
            <Button type="button" onClick={handleConfirmTransfer}>
              Potrdi in prenesi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
