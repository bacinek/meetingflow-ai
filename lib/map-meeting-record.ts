import type { MeetingRecord } from "@/lib/schemas/meeting";

export type ActionItemRow = {
  task: string;
  responsible_person: string | null;
  deadline_label: string | null;
  deadline_date: string | null;
};

export type MeetingRow = {
  id: string;
  created_at: string;
  client_name: string | null;
  meeting_topic: string | null;
  summary: string;
  key_information: string[] | null;
  client_requirements: string[] | null;
  decisions: string[] | null;
  next_meeting: string | null;
  follow_up_subject: string | null;
  follow_up_body: string | null;
  uncertainties: string[] | null;
  action_items: ActionItemRow[] | null;
};

function formatDeadlineDate(value: string | null): string | null {
  if (value === null || value === "") {
    return null;
  }
  return value.slice(0, 10);
}

export function mapMeetingRowToRecord(row: MeetingRow): MeetingRecord {
  const items = row.action_items ?? [];
  return {
    id: row.id,
    createdAt: row.created_at,
    clientName: row.client_name,
    meetingTopic: row.meeting_topic,
    summary: row.summary,
    keyInformation: row.key_information ?? [],
    clientRequirements: row.client_requirements ?? [],
    decisions: row.decisions ?? [],
    nextMeeting: row.next_meeting,
    uncertainties: row.uncertainties ?? [],
    followUpSubject: row.follow_up_subject ?? "",
    followUpBody: row.follow_up_body ?? "",
    actionItems: items.map((item) => ({
      task: item.task,
      responsiblePerson: item.responsible_person,
      deadlineLabel: item.deadline_label,
      deadlineDate: formatDeadlineDate(item.deadline_date),
    })),
  };
}
