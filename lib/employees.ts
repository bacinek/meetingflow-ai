import type { ActionItem, MeetingAnalysis } from "@/lib/schemas/meeting";

export const UNSPECIFIED_OWNER = "Ni določeno";

export const DEMO_EMPLOYEES = [
  "Ana Novak",
  "Marko Kovač",
  "Luka Horvat",
  "Nina Zupan",
] as const;

export type DemoEmployee = (typeof DEMO_EMPLOYEES)[number];

export type PersonMatchKind =
  | "exact"
  | "inferred-surname"
  | "ambiguous"
  | "none";

export type PersonMatchResult = {
  employee: DemoEmployee | null;
  kind: PersonMatchKind;
  raw: string | null;
};

export type HydratedActionItem = ActionItem & {
  matchKind: PersonMatchKind;
  matchRaw: string | null;
};

export type HydratedMeetingAnalysis = Omit<MeetingAnalysis, "actionItems"> & {
  actionItems: HydratedActionItem[];
};

function normalizeForCompare(value: string): string {
  return value.trim().toLocaleLowerCase("sl-SI");
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export function matchResponsiblePerson(
  raw: string | null | undefined,
): PersonMatchResult {
  if (raw === null || raw === undefined) {
    return { employee: null, kind: "none", raw: null };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { employee: null, kind: "none", raw: null };
  }

  const normalizedRaw = normalizeForCompare(trimmed);

  for (const employee of DEMO_EMPLOYEES) {
    if (normalizeForCompare(employee) === normalizedRaw) {
      return { employee, kind: "exact", raw: trimmed };
    }
  }

  const rawFirst = normalizeForCompare(firstName(trimmed));
  const byFirstName = DEMO_EMPLOYEES.filter(
    (employee) => normalizeForCompare(firstName(employee)) === rawFirst,
  );

  if (byFirstName.length === 1) {
    return {
      employee: byFirstName[0],
      kind: "inferred-surname",
      raw: trimmed,
    };
  }

  if (byFirstName.length > 1) {
    return { employee: null, kind: "ambiguous", raw: trimmed };
  }

  return { employee: null, kind: "none", raw: trimmed };
}

export function responsiblePersonToSelectValue(
  responsiblePerson: string | null,
): string {
  if (responsiblePerson === null) {
    return UNSPECIFIED_OWNER;
  }
  const normalized = normalizeForCompare(responsiblePerson);
  const employee = DEMO_EMPLOYEES.find(
    (name) => normalizeForCompare(name) === normalized,
  );
  return employee ?? UNSPECIFIED_OWNER;
}

export function selectValueToResponsiblePerson(value: string): string | null {
  if (value === UNSPECIFIED_OWNER) {
    return null;
  }
  return value;
}

export function hydrateAnalysis(analysis: MeetingAnalysis): HydratedMeetingAnalysis {
  const actionItems: HydratedActionItem[] = analysis.actionItems.map((item) => {
    const match = matchResponsiblePerson(item.responsiblePerson);
    return {
      ...item,
      responsiblePerson: match.employee,
      matchKind: match.kind,
      matchRaw: match.raw,
    };
  });

  return {
    ...analysis,
    actionItems,
  };
}

export function toMeetingAnalysis(
  hydrated: HydratedMeetingAnalysis,
): MeetingAnalysis {
  return {
    ...hydrated,
    actionItems: hydrated.actionItems.map((item) => ({
      task: item.task,
      responsiblePerson: item.responsiblePerson,
      deadlineLabel: item.deadlineLabel,
      deadlineDate: item.deadlineDate,
    })),
  };
}
