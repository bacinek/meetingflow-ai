"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ANALYZE_MESSAGES } from "@/lib/analyze-messages";
import { SAMPLE_TRANSCRIPT } from "@/lib/sample-transcript";
import {
  getFileExtension,
  isAllowedUploadExtension,
  MAX_TRANSCRIPT_CHARS,
  MAX_UPLOAD_BYTES,
} from "@/lib/transcript-limits";
import { TRANSCRIPT_MESSAGES } from "@/lib/transcript-messages";

type AlertState = { kind: "error"; message: string } | null;

type TranscriptPanelProps = {
  analyzing: boolean;
  onAnalyzingChange: (analyzing: boolean) => void;
  onAnalyze: (transcript: string) => Promise<void>;
};

export function TranscriptPanel({
  analyzing,
  onAnalyzingChange,
  onAnalyze,
}: TranscriptPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transcript, setTranscript] = useState("");
  const [alert, setAlert] = useState<AlertState>(null);
  const [extracting, setExtracting] = useState(false);

  const busy = extracting || analyzing;

  function validateTranscript(text: string): string | null {
    const trimmed = text.trim();
    if (!trimmed) {
      return TRANSCRIPT_MESSAGES.empty;
    }
    if (text.length > MAX_TRANSCRIPT_CHARS) {
      return TRANSCRIPT_MESSAGES.tooLong(MAX_TRANSCRIPT_CHARS);
    }
    return null;
  }

  function handleTranscriptChange(value: string) {
    setTranscript(value);
    if (value.length > MAX_TRANSCRIPT_CHARS) {
      setAlert({
        kind: "error",
        message: TRANSCRIPT_MESSAGES.tooLong(MAX_TRANSCRIPT_CHARS),
      });
      return;
    }
    setAlert(null);
  }

  function handleUseSample() {
    setTranscript(SAMPLE_TRANSCRIPT);
    setAlert(null);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setAlert(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setAlert({ kind: "error", message: TRANSCRIPT_MESSAGES.fileTooLarge });
      return;
    }

    const extension = getFileExtension(file.name);
    if (!isAllowedUploadExtension(extension)) {
      setAlert({ kind: "error", message: TRANSCRIPT_MESSAGES.fileUnsupported });
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-transcript", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        text?: string;
        error?: string;
      };

      if (!response.ok || !payload.text) {
        setAlert({
          kind: "error",
          message: payload.error ?? TRANSCRIPT_MESSAGES.extractFailed,
        });
        return;
      }

      if (payload.text.length > MAX_TRANSCRIPT_CHARS) {
        setAlert({
          kind: "error",
          message: TRANSCRIPT_MESSAGES.tooLong(MAX_TRANSCRIPT_CHARS),
        });
        return;
      }

      setTranscript(payload.text);
      setAlert(null);
    } catch {
      setAlert({ kind: "error", message: TRANSCRIPT_MESSAGES.extractFailed });
    } finally {
      setExtracting(false);
    }
  }

  async function handleAnalyze() {
    const validationError = validateTranscript(transcript);
    if (validationError) {
      setAlert({ kind: "error", message: validationError });
      return;
    }

    setAlert(null);
    onAnalyzingChange(true);

    try {
      await onAnalyze(transcript);
      setAlert(null);
    } catch (error) {
      setAlert({
        kind: "error",
        message:
          error instanceof Error ? error.message : ANALYZE_MESSAGES.aiFailure,
      });
    } finally {
      onAnalyzingChange(false);
    }
  }

  const charCount = transcript.length;
  const nearLimit = charCount > MAX_TRANSCRIPT_CHARS * 0.9;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        V produkciji bi transkript prišel iz Microsoft Teams, Zoom, Google
        Meet, CRM-ja ali drugega internega sistema. Tukaj ga prilepite ali
        naložite kot datoteko.
      </p>

      {alert ? (
        <Alert variant="destructive">
          <AlertTitle>Napaka</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="meeting-transcript">Transkript sestanka</Label>
        <Textarea
          id="meeting-transcript"
          value={transcript}
          onChange={(event) => handleTranscriptChange(event.target.value)}
          placeholder="Prilepite zapis oziroma transkript sestanka ..."
          rows={14}
          disabled={busy}
          aria-invalid={
            charCount > MAX_TRANSCRIPT_CHARS || alert?.kind === "error"
          }
          className="min-h-48 border-border bg-background font-mono text-sm leading-relaxed shadow-xs"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {charCount.toLocaleString("sl-SI")} /{" "}
            {MAX_TRANSCRIPT_CHARS.toLocaleString("sl-SI")} znakov
          </span>
          {nearLimit ? (
            <span className={charCount > MAX_TRANSCRIPT_CHARS ? "text-destructive" : ""}>
              {charCount > MAX_TRANSCRIPT_CHARS
                ? "Presežena omejitev"
                : "Blizu omejitve"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={handleFileChange}
          disabled={busy}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          {extracting ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Upload aria-hidden />
          )}
          Naloži datoteko
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={handleUseSample}
        >
          Uporabi primer
        </Button>
        <Button
          type="button"
          className="sm:ml-auto"
          onClick={() => void handleAnalyze()}
          disabled={busy}
        >
          {analyzing ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : null}
          Analiziraj z AI
        </Button>
      </div>
    </div>
  );
}
