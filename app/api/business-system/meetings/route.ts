import {
  mapMeetingRowToRecord,
  type MeetingRow,
} from "@/lib/map-meeting-record";
import { meetingsListResponseSchema, transferRequestSchema } from "@/lib/schemas/meeting";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TRANSFER_MESSAGES } from "@/lib/transfer-messages";

export const runtime = "nodejs";

export async function GET() {
  try {
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return Response.json(
        { error: TRANSFER_MESSAGES.loadFailure },
        { status: 503 },
      );
    }

    const { data, error } = await supabase
      .from("meetings")
      .select(
        `
        id,
        created_at,
        client_name,
        meeting_topic,
        summary,
        key_information,
        client_requirements,
        decisions,
        next_meeting,
        follow_up_subject,
        follow_up_body,
        uncertainties,
        action_items (
          task,
          responsible_person,
          deadline_label,
          deadline_date
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { error: TRANSFER_MESSAGES.loadFailure },
        { status: 503 },
      );
    }

    const meetings = (data ?? []).map((row) =>
      mapMeetingRowToRecord(row as MeetingRow),
    );

    const validated = meetingsListResponseSchema.safeParse({ meetings });
    if (!validated.success) {
      return Response.json(
        { error: TRANSFER_MESSAGES.loadFailure },
        { status: 503 },
      );
    }

    return Response.json(validated.data);
  } catch {
    return Response.json(
      { error: TRANSFER_MESSAGES.loadFailure },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: TRANSFER_MESSAGES.invalidPayload },
        { status: 400 },
      );
    }

    const parsed = transferRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: TRANSFER_MESSAGES.invalidPayload },
        { status: 400 },
      );
    }

    const { simulateFailure, followUpDraft, actionItems, ...meeting } =
      parsed.data;

    if (simulateFailure === true) {
      return Response.json(
        { error: TRANSFER_MESSAGES.failure },
        { status: 503 },
      );
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return Response.json(
        { error: TRANSFER_MESSAGES.failure },
        { status: 503 },
      );
    }

    const { data: insertedMeeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        client_name: meeting.clientName,
        meeting_topic: meeting.meetingTopic,
        summary: meeting.summary,
        key_information: meeting.keyInformation,
        client_requirements: meeting.clientRequirements,
        decisions: meeting.decisions,
        next_meeting: meeting.nextMeeting,
        follow_up_subject: followUpDraft.subject,
        follow_up_body: followUpDraft.body,
        uncertainties: meeting.uncertainties,
      })
      .select("id, created_at")
      .single();

    if (meetingError || !insertedMeeting) {
      return Response.json(
        { error: TRANSFER_MESSAGES.failure },
        { status: 503 },
      );
    }

    const meetingId = insertedMeeting.id as string;

    if (actionItems.length > 0) {
      const { error: itemsError } = await supabase.from("action_items").insert(
        actionItems.map((item) => ({
          meeting_id: meetingId,
          task: item.task,
          responsible_person: item.responsiblePerson,
          deadline_label: item.deadlineLabel,
          deadline_date: item.deadlineDate,
        })),
      );

      if (itemsError) {
        await supabase.from("meetings").delete().eq("id", meetingId);
        return Response.json(
          { error: TRANSFER_MESSAGES.failure },
          { status: 503 },
        );
      }
    }

    return Response.json({
      meetingId,
      createdAt: insertedMeeting.created_at as string,
    });
  } catch {
    return Response.json(
      { error: TRANSFER_MESSAGES.failure },
      { status: 503 },
    );
  }
}
