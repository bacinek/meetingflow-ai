"use client";

import { Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  DEMO_EMPLOYEES,
  type HydratedActionItem,
  type HydratedMeetingAnalysis,
  responsiblePersonToSelectValue,
  selectValueToResponsiblePerson,
  UNSPECIFIED_OWNER,
} from "@/lib/employees";
import {
  deriveUncertaintiesFromReview,
  mergeUncertainties,
} from "@/lib/uncertainties";
import { cn } from "@/lib/utils";

type ReviewFormProps = {
  review: HydratedMeetingAnalysis;
  onChange: (review: HydratedMeetingAnalysis) => void;
};

function ReviewPanel({
  title,
  titleId,
  children,
  className,
}: {
  title: string;
  titleId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn("review-panel", className)}
    >
      <h3 id={titleId} className="review-panel-title">
        {title}
      </h3>
      {children}
    </section>
  );
}

function EditableStringList({
  label,
  items,
  onChange,
  addLabel,
  showLabel = true,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  showLabel?: boolean;
}) {
  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div className="space-y-2">
      {showLabel ? (
        <Label className="text-foreground">{label}</Label>
      ) : null}
      <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              aria-label={`${label} ${index + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => removeItem(index)}
              aria-label={`Odstrani ${label.toLowerCase()} ${index + 1}`}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" size="sm" onClick={addItem}>
        <Plus aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}

function ActionItemOwnerSelect({
  item,
  onSelect,
}: {
  item: HydratedActionItem;
  onSelect: (value: string) => void;
}) {
  const value = responsiblePersonToSelectValue(item.responsiblePerson);

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) {
          onSelect(next);
        }
      }}
    >
      <SelectTrigger className="w-full min-w-[10rem]" size="sm">
        <SelectValue placeholder={UNSPECIFIED_OWNER} />
      </SelectTrigger>
      <SelectContent>
        {DEMO_EMPLOYEES.map((employee) => (
          <SelectItem key={employee} value={employee}>
            {employee}
          </SelectItem>
        ))}
        <SelectItem value={UNSPECIFIED_OWNER}>{UNSPECIFIED_OWNER}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ActionItemFields({
  item,
  onUpdate,
  onRemove,
}: {
  item: HydratedActionItem;
  onUpdate: (item: HydratedActionItem) => void;
  onRemove: () => void;
}) {
  function handleOwnerChange(selected: string) {
    const person = selectValueToResponsiblePerson(selected);
    onUpdate({
      ...item,
      responsiblePerson: person,
      matchKind: person ? "exact" : "none",
      matchRaw: null,
    });
  }

  return (
    <>
      <div className="space-y-1 md:hidden">
        <Label className="text-xs text-muted-foreground">Naloga</Label>
        <Input
          value={item.task}
          onChange={(event) =>
            onUpdate({ ...item, task: event.target.value })
          }
        />
      </div>
      <div className="space-y-1 md:hidden">
        <Label className="text-xs text-muted-foreground">Odgovorna oseba</Label>
        <ActionItemOwnerSelect item={item} onSelect={handleOwnerChange} />
        <p className="text-xs text-muted-foreground">
          V prototipu so zaposleni vnaprej določeni. V produkciji bi jih pridobili
          iz internega poslovnega sistema prek API-ja.
        </p>
      </div>
      <div className="grid gap-2 md:hidden sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Rok (opis)</Label>
          <Input
            value={item.deadlineLabel ?? ""}
            onChange={(event) =>
              onUpdate({
                ...item,
                deadlineLabel: event.target.value || null,
              })
            }
            placeholder="npr. petek"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Rok (datum)</Label>
          <Input
            type="date"
            value={item.deadlineDate ?? ""}
            onChange={(event) =>
              onUpdate({
                ...item,
                deadlineDate: event.target.value || null,
              })
            }
          />
        </div>
      </div>
      <div className="flex justify-end md:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
        >
          <Trash2 aria-hidden />
          Odstrani nalogo
        </Button>
      </div>
    </>
  );
}

export function ReviewForm({ review, onChange }: ReviewFormProps) {
  const derived = deriveUncertaintiesFromReview(review);
  const visibleUncertainties = mergeUncertainties(
    review.uncertainties,
    derived,
  );

  function patch(partial: Partial<HydratedMeetingAnalysis>) {
    onChange({ ...review, ...partial });
  }

  function updateActionItem(index: number, item: HydratedActionItem) {
    const actionItems = [...review.actionItems];
    actionItems[index] = item;
    patch({ actionItems });
  }

  function removeActionItem(index: number) {
    patch({
      actionItems: review.actionItems.filter((_, i) => i !== index),
    });
  }

  function addActionItem() {
    const newItem: HydratedActionItem = {
      task: "",
      responsiblePerson: null,
      deadlineLabel: null,
      deadlineDate: null,
      matchKind: "none",
      matchRaw: null,
    };
    patch({ actionItems: [...review.actionItems, newItem] });
  }

  return (
    <div className="space-y-6">
      {visibleUncertainties.length > 0 ? (
        <Alert className="border-l-4 border-l-primary bg-primary/5">
          <AlertTitle>Nejasnosti / potrebna potrditev</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {visibleUncertainties.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <ReviewPanel title="Ključne informacije" titleId="key-info-heading">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client-name">Stranka</Label>
            <Input
              id="client-name"
              value={review.clientName ?? ""}
              onChange={(event) =>
                patch({ clientName: event.target.value || null })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-topic">Tema sestanka</Label>
            <Input
              id="meeting-topic"
              value={review.meetingTopic ?? ""}
              onChange={(event) =>
                patch({ meetingTopic: event.target.value || null })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="next-meeting">Naslednji sestanek</Label>
          <Input
            id="next-meeting"
            value={review.nextMeeting ?? ""}
            onChange={(event) =>
              patch({ nextMeeting: event.target.value || null })
            }
          />
        </div>
        <EditableStringList
          label="Ključne informacije (seznam)"
          items={review.keyInformation}
          onChange={(keyInformation) => patch({ keyInformation })}
          addLabel="Dodaj informacijo"
        />
      </ReviewPanel>

      <ReviewPanel title="Povzetek" titleId="summary-heading">
        <Textarea
          value={review.summary}
          onChange={(event) => patch({ summary: event.target.value })}
          rows={6}
          className="min-h-32"
        />
      </ReviewPanel>

      <ReviewPanel title="Zahteve stranke" titleId="requirements-heading">
        <EditableStringList
          label="Zahteve stranke"
          showLabel={false}
          items={review.clientRequirements}
          onChange={(clientRequirements) => patch({ clientRequirements })}
          addLabel="Dodaj zahtevo"
        />
      </ReviewPanel>

      <ReviewPanel title="Dogovorjene odločitve" titleId="decisions-heading">
        <EditableStringList
          label="Dogovorjene odločitve"
          showLabel={false}
          items={review.decisions}
          onChange={(decisions) => patch({ decisions })}
          addLabel="Dodaj odločitev"
        />
      </ReviewPanel>

      <ReviewPanel title="Naslednji koraki" titleId="action-items-heading">
        <div className="flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={addActionItem}>
            <Plus aria-hidden />
            Dodaj nalogo
          </Button>
        </div>

        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Naloga</TableHead>
                <TableHead>Odgovorna oseba</TableHead>
                <TableHead>Rok (opis)</TableHead>
                <TableHead>Rok (datum)</TableHead>
                <TableHead className="w-[3rem]">
                  <span className="sr-only">Odstrani</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.actionItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-[12rem] whitespace-normal">
                    <Input
                      value={item.task}
                      onChange={(event) =>
                        updateActionItem(index, {
                          ...item,
                          task: event.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="min-w-[11rem] whitespace-normal">
                    <ActionItemOwnerSelect
                      item={item}
                      onSelect={(selected) => {
                        const person = selectValueToResponsiblePerson(selected);
                        updateActionItem(index, {
                          ...item,
                          responsiblePerson: person,
                          matchKind: person ? "exact" : "none",
                          matchRaw: null,
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.deadlineLabel ?? ""}
                      onChange={(event) =>
                        updateActionItem(index, {
                          ...item,
                          deadlineLabel: event.target.value || null,
                        })
                      }
                      placeholder="npr. petek"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={item.deadlineDate ?? ""}
                      onChange={(event) =>
                        updateActionItem(index, {
                          ...item,
                          deadlineDate: event.target.value || null,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeActionItem(index)}
                      aria-label={`Odstrani nalogo ${index + 1}`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            V prototipu so zaposleni vnaprej določeni. V produkciji bi jih
            pridobili iz internega poslovnega sistema prek API-ja.
          </p>
        </div>

        <div className="space-y-4 md:hidden">
          {review.actionItems.map((item, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 shadow-sm"
            >
              <ActionItemFields
                item={item}
                onUpdate={(updated) => updateActionItem(index, updated)}
                onRemove={() => removeActionItem(index)}
              />
            </div>
          ))}
        </div>
      </ReviewPanel>
    </div>
  );
}
