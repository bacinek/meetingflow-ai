export const MAX_TRANSCRIPT_CHARS = 50_000;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = [".txt", ".pdf", ".docx"] as const;

export type AllowedUploadExtension = (typeof ALLOWED_UPLOAD_EXTENSIONS)[number];

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}

export function isAllowedUploadExtension(
  ext: string,
): ext is AllowedUploadExtension {
  return (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext);
}
