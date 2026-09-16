import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
  ThinkingLevel,
  Type,
} from "@google/genai";
import { DEFAULT_GEMINI_MODEL_COMPARE, DEFAULT_GEMINI_MODEL_TRAIN } from "@/lib/constants";

export type GeminiFileRef = {
  name: string;
  uri: string;
  mimeType: string;
};

export type GeminiUsage = {
  inputTokens: number;
  outputTokens: number;
};

const EMPTY_USAGE: GeminiUsage = { inputTokens: 0, outputTokens: 0 };

export function geminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

export function geminiTrainModel() {
  return process.env.GEMINI_MODEL_TRAIN?.trim() || DEFAULT_GEMINI_MODEL_TRAIN;
}

export function geminiCompareModel() {
  return process.env.GEMINI_MODEL_COMPARE?.trim() || DEFAULT_GEMINI_MODEL_COMPARE;
}

export function geminiDraftModel() {
  return process.env.GEMINI_MODEL_DRAFT?.trim() || geminiCompareModel();
}

export function geminiClient() {
  const apiKey = geminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isActive(state: string | undefined) {
  return (state ?? "").toUpperCase().includes("ACTIVE");
}

function isFailed(state: string | undefined) {
  return (state ?? "").toUpperCase().includes("FAILED");
}

export async function uploadGeminiFile(
  ai: GoogleGenAI,
  bytes: Buffer,
  mimeType: string,
  displayName: string,
): Promise<GeminiFileRef> {
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  const uploaded = await ai.files.upload({
    file: blob,
    config: { mimeType, displayName },
  });
  const name = uploaded.name;
  if (!name) throw new Error("Gemini file upload returned no name");

  let file = uploaded;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (isActive(file.state)) {
      if (!file.uri) throw new Error("Gemini file is active but missing uri");
      return { name, uri: file.uri, mimeType: file.mimeType || mimeType };
    }
    if (isFailed(file.state)) {
      throw new Error(`Gemini file processing failed (${displayName})`);
    }
    await sleep(2000);
    file = await ai.files.get({ name });
  }
  throw new Error(`Gemini file processing timed out (${displayName})`);
}

export async function deleteGeminiFile(ai: GoogleGenAI, name: string) {
  try {
    await ai.files.delete({ name });
  } catch {
    // expiry is 48h; ignore cleanup failures
  }
}

function usageFrom(response: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }) {
  return {
    inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    throw new Error("Gemini did not return JSON");
  }
}

export const TRAIN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    key: { type: Type.STRING },
    tempoBpm: { type: Type.NUMBER },
    timeSignature: { type: Type.STRING },
    barCount: { type: Type.NUMBER },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          startBar: { type: Type.NUMBER },
          endBar: { type: Type.NUMBER },
          chords: { type: Type.ARRAY, items: { type: Type.STRING } },
          melodyNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          lyrics: { type: Type.STRING },
        },
        required: ["name", "startBar", "endBar", "chords", "melodyNotes"],
      },
    },
    tutorialCues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tStart: { type: Type.NUMBER },
          tEnd: { type: Type.NUMBER },
          topic: { type: Type.STRING },
          instruction: { type: Type.STRING },
          bar: { type: Type.NUMBER },
        },
        required: ["tStart", "topic", "instruction"],
      },
    },
    techniqueFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
    commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["title", "key", "timeSignature", "barCount", "sections", "tutorialCues", "techniqueFocus", "commonMistakes"],
};

export const COMPARE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallFit: { type: Type.NUMBER },
    confidence: { type: Type.NUMBER },
    positives: { type: Type.ARRAY, items: { type: Type.STRING } },
    nextPractice: { type: Type.STRING },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["timing", "pitch", "chord", "technique", "missing"] },
          bar: { type: Type.NUMBER },
          tStart: { type: Type.NUMBER },
          tEnd: { type: Type.NUMBER },
          expected: { type: Type.STRING },
          observed: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ["type", "expected", "observed", "confidence"],
      },
    },
  },
  required: ["overallFit", "confidence", "positives", "issues", "nextPractice"],
};

export async function generateGeminiJson(input: {
  ai: GoogleGenAI;
  model: string;
  system: string;
  userText: string;
  files?: GeminiFileRef[];
  schema: object;
  thinkingLevel?: ThinkingLevel;
}): Promise<{ data: unknown; usage: GeminiUsage; model: string }> {
  const parts = [
    ...(input.files ?? []).map((file) => createPartFromUri(file.uri, file.mimeType)),
    input.userText,
  ];
  const response = await input.ai.models.generateContent({
    model: input.model,
    contents: createUserContent(parts),
    config: {
      systemInstruction: input.system,
      responseMimeType: "application/json",
      responseJsonSchema: input.schema,
      thinkingConfig: { thinkingLevel: input.thinkingLevel ?? ThinkingLevel.LOW },
    },
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return {
    data: parseJsonText(text),
    usage: usageFrom(response),
    model: input.model,
  };
}

export async function generateGeminiText(input: {
  ai: GoogleGenAI;
  model: string;
  system: string;
  userText: string;
}): Promise<{ text: string; usage: GeminiUsage; model: string }> {
  const response = await input.ai.models.generateContent({
    model: input.model,
    contents: input.userText,
    config: {
      systemInstruction: input.system,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });
  const text = response.text?.trim();
  if (!text) return { text: "", usage: EMPTY_USAGE, model: input.model };
  return { text, usage: usageFrom(response), model: input.model };
}

/** Flash 3.5 list: $1.50 / 1M in, $9 / 1M out (thinking counted as output). */
export function geminiCostCents(usage: GeminiUsage) {
  const cents = usage.inputTokens * 0.00015 + usage.outputTokens * 0.0009;
  return Math.max(1, Math.round(cents));
}
