"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MeetingRecord } from "@/lib/schemas/meeting";
import { TRANSFER_MESSAGES } from "@/lib/transfer-messages";

type LoadState = "loading" | "error" | "ready";

function formatOptional(value: string | null): string {
  if (value === null || value.trim() === "") {
    return "Ni določeno";
  }
  return value.trim();
}

function formatTransferDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("sl-SI", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StringList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function MeetingCardDetails({ meeting }: { meeting: MeetingRecord }) {
  return (
    <div className="space-y-5">
        <section className="review-panel">
          <h3 className="review-panel-title">Tema sestanka</h3>
          <p className="text-sm leading-relaxed">
            {formatOptional(meeting.meetingTopic)}
          </p>
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Povzetek</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {meeting.summary}
          </p>
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Ključne informacije</h3>
          <StringList items={meeting.keyInformation} emptyLabel="Ni določeno" />
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Zahteve stranke</h3>
          <StringList
            items={meeting.clientRequirements}
            emptyLabel="Ni določeno"
          />
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Dogovorjene odločitve</h3>
          <StringList items={meeting.decisions} emptyLabel="Ni določeno" />
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Naslednji koraki</h3>
          {meeting.actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ni določeno</p>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-border md:block">
                <Table>
                  <TableHeader className="bg-muted/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Naloga</TableHead>
                      <TableHead>Odgovorna oseba</TableHead>
                      <TableHead>Rok (opis)</TableHead>
                      <TableHead>Rok (datum)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meeting.actionItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="whitespace-normal">
                          {item.task || "Ni določeno"}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          {formatOptional(item.responsiblePerson)}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          {formatOptional(item.deadlineLabel)}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          {formatOptional(item.deadlineDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 md:hidden">
                {meeting.actionItems.map((item, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">Naloga: </span>
                      {item.task || "Ni določeno"}
                    </div>
                    <div>
                      <span className="font-medium">Odgovorna oseba: </span>
                      {formatOptional(item.responsiblePerson)}
                    </div>
                    <div>
                      <span className="font-medium">Rok (opis): </span>
                      {formatOptional(item.deadlineLabel)}
                    </div>
                    <div>
                      <span className="font-medium">Rok (datum): </span>
                      {formatOptional(item.deadlineDate)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Naslednji sestanek</h3>
          <p className="text-sm leading-relaxed">
            {formatOptional(meeting.nextMeeting)}
          </p>
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Nejasnosti / potrebna potrditev</h3>
          <StringList items={meeting.uncertainties} emptyLabel="Ni določeno" />
        </section>

        <section className="review-panel">
          <h3 className="review-panel-title">Follow-up sporočilo</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">Zadeva</p>
              <p className="mt-1 leading-relaxed">
                {meeting.followUpSubject || "Ni določeno"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-foreground">Telo sporočila</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {meeting.followUpBody || "Ni določeno"}
              </p>
            </div>
          </div>
        </section>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingRecord }) {
  const [expanded, setExpanded] = useState(false);
  const summaryId = `meeting-details-${meeting.id}`;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 sm:px-5"
        aria-expanded={expanded}
        aria-controls={summaryId}
        onClick={() => setExpanded((open) => !open)}
      >
        <ChevronDown
          aria-hidden
          className={`size-5 shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate font-heading text-base font-semibold tracking-tight">
            {formatOptional(meeting.clientName)}
          </p>
          <p className="text-sm text-muted-foreground">
            Datum prenosa: {formatTransferDate(meeting.createdAt)}
          </p>
        </div>
      </button>
      {expanded ? (
        <CardContent id={summaryId} className="space-y-5 border-t border-border pt-5">
          <MeetingCardDetails meeting={meeting} />
        </CardContent>
      ) : null}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[4.5rem] w-full rounded-xl" />
      <Skeleton className="h-[4.5rem] w-full rounded-xl" />
      <Skeleton className="h-[4.5rem] w-full rounded-xl" />
    </div>
  );
}

export function BusinessSystemMeetings() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState("loading");
      try {
        const response = await fetch("/api/business-system/meetings");
        const body = (await response.json()) as {
          meetings?: MeetingRecord[];
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !body.meetings) {
          setLoadState("error");
          return;
        }

        setMeetings(body.meetings);
        setLoadState("ready");
      } catch {
        if (!cancelled) {
          setLoadState("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadState === "loading") {
    return <LoadingSkeleton />;
  }

  if (loadState === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Napaka pri branju</AlertTitle>
        <AlertDescription>{TRANSFER_MESSAGES.loadFailure}</AlertDescription>
      </Alert>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ni prenesenih sestankov</CardTitle>
          <CardDescription>
            Ko boste na glavni strani potrdili in prenesli podatke, se bodo tukaj
            prikazali zapisi sestankov in pripadajočih nalog.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}
