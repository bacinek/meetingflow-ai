import type { HydratedActionItem } from "@/lib/employees";
import type { MeetingAnalysis } from "@/lib/schemas/meeting";

function hasDeadline(item: {
  deadlineLabel: string | null;
  deadlineDate: string | null;
}): boolean {
  return (
    (item.deadlineLabel !== null && item.deadlineLabel.trim() !== "") ||
    item.deadlineDate !== null
  );
}

function taskLabel(task: string): string {
  const trimmed = task.trim();
  return trimmed || "naloga";
}

export function deriveUncertaintiesFromReview(
  review: Pick<
    MeetingAnalysis,
    "actionItems" | "nextMeeting" | "clientRequirements"
  > & {
    actionItems: HydratedActionItem[];
  },
): string[] {
  const bullets: string[] = [];

  for (const item of review.actionItems) {
    if (item.responsiblePerson === null) {
      bullets.push(
        `Odgovorna oseba za nalogo «${taskLabel(item.task)}» ni bila jasno določena.`,
      );
    }

    if (!hasDeadline(item)) {
      bullets.push(
        `Rok za nalogo «${taskLabel(item.task)}» ni bil jasno določen.`,
      );
    }

    if (item.matchKind === "inferred-surname" && item.matchRaw) {
      bullets.push(
        `Pri nalogi «${taskLabel(item.task)}» je bil v transkriptu naveden le ime «${item.matchRaw}»; priimek je bil sklepan iz seznama zaposlenih (${item.responsiblePerson ?? "Ni določeno"}).`,
      );
    }

    if (item.matchKind === "ambiguous" && item.matchRaw) {
      bullets.push(
        `Pri nalogi «${taskLabel(item.task)}» ime «${item.matchRaw}» ustreza več zaposlenim; odgovorno osebo je treba ročno potrditi.`,
      );
    }
  }

  if (
    review.nextMeeting === null ||
    review.nextMeeting.trim() === ""
  ) {
    bullets.push("Točen datum naslednjega sestanka ni bil potrjen.");
  }

  return bullets;
}

export function mergeUncertainties(
  aiUncertainties: string[],
  derived: string[],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const note of [...aiUncertainties, ...derived]) {
    const trimmed = note.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    merged.push(trimmed);
  }

  return merged;
}
