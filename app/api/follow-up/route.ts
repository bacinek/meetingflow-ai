import { zodTextFormat } from "openai/helpers/zod";

import { FOLLOW_UP_MESSAGES } from "@/lib/follow-up-messages";
import { FOLLOW_UP_SYSTEM_PROMPT } from "@/lib/follow-up-prompt";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import {
  followUpDraftSchema,
  followUpRequestSchema,
} from "@/lib/schemas/meeting";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: FOLLOW_UP_MESSAGES.invalidShape },
        { status: 400 },
      );
    }

    const parsedBody = followUpRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return Response.json(
        { error: FOLLOW_UP_MESSAGES.invalidShape },
        { status: 400 },
      );
    }

    let openai;
    try {
      openai = getOpenAIClient();
    } catch {
      return Response.json(
        { error: FOLLOW_UP_MESSAGES.failure },
        { status: 502 },
      );
    }

    const model = getOpenAIModel();
    const meetingJson = JSON.stringify(parsedBody.data, null, 2);

    let response;
    try {
      response = await openai.responses.parse({
        model,
        input: [
          { role: "system", content: FOLLOW_UP_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate a follow-up email draft from this confirmed meeting data:\n\n${meetingJson}`,
          },
        ],
        text: {
          format: zodTextFormat(followUpDraftSchema, "follow_up_draft"),
        },
      });
    } catch {
      return Response.json(
        { error: FOLLOW_UP_MESSAGES.failure },
        { status: 502 },
      );
    }

    if (response.output_parsed === null || response.output_parsed === undefined) {
      return Response.json(
        { error: FOLLOW_UP_MESSAGES.invalidShape },
        { status: 422 },
      );
    }

    const validated = followUpDraftSchema.safeParse(response.output_parsed);
    if (!validated.success) {
      return Response.json(
        { error: FOLLOW_UP_MESSAGES.invalidShape },
        { status: 422 },
      );
    }

    return Response.json(validated.data);
  } catch {
    return Response.json(
      { error: FOLLOW_UP_MESSAGES.failure },
      { status: 502 },
    );
  }
}
