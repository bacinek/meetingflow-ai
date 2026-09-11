import { zodTextFormat } from "openai/helpers/zod";

import { ANALYZE_MESSAGES } from "@/lib/analyze-messages";
import { ANALYZE_SYSTEM_PROMPT } from "@/lib/analyze-prompt";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import {
  analyzeRequestSchema,
  meetingAnalysisSchema,
  meetingAnalysisStructuredSchema,
} from "@/lib/schemas/meeting";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/transcript-limits";
import { TRANSCRIPT_MESSAGES } from "@/lib/transcript-messages";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.empty },
        { status: 400 },
      );
    }

    const parsedBody = analyzeRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.empty },
        { status: 400 },
      );
    }

    const transcript = parsedBody.data.transcript;
    const trimmed = transcript.trim();

    if (!trimmed) {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.empty },
        { status: 400 },
      );
    }

    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.tooLong(MAX_TRANSCRIPT_CHARS) },
        { status: 400 },
      );
    }

    let openai;
    try {
      openai = getOpenAIClient();
    } catch {
      return Response.json(
        { error: ANALYZE_MESSAGES.aiFailure },
        { status: 502 },
      );
    }

    const model = getOpenAIModel();

    let response;
    try {
      response = await openai.responses.parse({
        model,
        input: [
          { role: "system", content: ANALYZE_SYSTEM_PROMPT },
          { role: "user", content: trimmed },
        ],
        text: {
          format: zodTextFormat(
            meetingAnalysisStructuredSchema,
            "meeting_analysis",
          ),
        },
      });
    } catch {
      return Response.json(
        { error: ANALYZE_MESSAGES.aiFailure },
        { status: 502 },
      );
    }

    if (response.output_parsed === null || response.output_parsed === undefined) {
      return Response.json(
        { error: ANALYZE_MESSAGES.invalidShape },
        { status: 422 },
      );
    }

    const validated = meetingAnalysisSchema.safeParse(response.output_parsed);
    if (!validated.success) {
      return Response.json(
        { error: ANALYZE_MESSAGES.invalidShape },
        { status: 422 },
      );
    }

    return Response.json({ analysis: validated.data });
  } catch {
    return Response.json(
      { error: ANALYZE_MESSAGES.aiFailure },
      { status: 502 },
    );
  }
}
