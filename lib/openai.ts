import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-5.6-sol";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export function getOpenAIModel(): string {
  const fromEnv = process.env.OPENAI_MODEL?.trim();
  return fromEnv || DEFAULT_MODEL;
}
