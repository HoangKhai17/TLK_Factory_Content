import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VideoSpec } from "@tlk/shared";
import { buildVideoSpecPrompt, SYSTEM_PROMPT } from "./prompts";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set in .env.local");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateVideoSpec(userPrompt: string): Promise<{
  spec: VideoSpec;
  assistantMessage: string;
}> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  // Step 1: Get friendly assistant message
  const chatModel = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
  });

  const chatResponse = await chatModel.generateContent(
    `Người dùng yêu cầu: "${userPrompt}"\n\nHãy xác nhận ngắn gọn (2-3 câu) rằng bạn đang tạo video theo yêu cầu. Không trả về JSON.`
  );
  const assistantMessage =
    chatResponse.response.text() ||
    "Đang tạo video spec theo yêu cầu của bạn...";

  // Step 2: Generate video spec JSON
  const specPrompt = buildVideoSpecPrompt(userPrompt);
  const specResponse = await model.generateContent(specPrompt);
  const rawText = specResponse.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch =
    rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    rawText.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? rawText) : rawText;

  let spec: VideoSpec;
  try {
    spec = JSON.parse(jsonStr.trim());
  } catch {
    throw new Error(`Gemini trả về JSON không hợp lệ: ${jsonStr.slice(0, 200)}`);
  }

  return { spec, assistantMessage };
}

export async function chatWithAssistant(
  messages: Array<{ role: "user" | "model"; parts: string }>,
  newMessage: string
): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
    },
  });

  const chat = model.startChat({
    history: messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.parts }],
    })),
  });

  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}

// Detect if user wants to create a video
export function isVideoCreationRequest(message: string): boolean {
  const keywords = [
    "tạo video",
    "make video",
    "create video",
    "render video",
    "làm video",
    "generate video",
    "video youtube",
    "video social",
    "video marketing",
    "text animation",
    "video quảng cáo",
    "video giới thiệu",
    "video ngắn",
  ];
  const lower = message.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}
