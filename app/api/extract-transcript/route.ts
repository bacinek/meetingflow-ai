import mammoth from "mammoth";

import { extractPdfText } from "@/lib/extract-pdf-text";
import {
  getFileExtension,
  isAllowedUploadExtension,
  MAX_UPLOAD_BYTES,
} from "@/lib/transcript-limits";
import { TRANSCRIPT_MESSAGES } from "@/lib/transcript-messages";

export const runtime = "nodejs";

async function extractTextFromBuffer(
  buffer: Buffer,
  extension: string,
): Promise<string> {
  if (extension === ".txt") {
    return buffer.toString("utf-8");
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (extension === ".pdf") {
    return extractPdfText(buffer);
  }

  throw new Error("unsupported");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.fileMissing },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.fileTooLarge },
        { status: 400 },
      );
    }

    const extension = getFileExtension(file.name);
    if (!isAllowedUploadExtension(extension)) {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.fileUnsupported },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    try {
      text = await extractTextFromBuffer(buffer, extension);
    } catch {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.extractFailed },
        { status: 422 },
      );
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return Response.json(
        { error: TRANSCRIPT_MESSAGES.extractFailed },
        { status: 422 },
      );
    }

    return Response.json({ text: trimmed });
  } catch {
    return Response.json(
      { error: TRANSCRIPT_MESSAGES.extractFailed },
      { status: 500 },
    );
  }
}
