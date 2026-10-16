import { GoogleGenAI } from "@google/genai";

export const GCP_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "h2gdm-hack26icn-2694";
export const GCP_PROJECT_NUMBER =
  process.env.GOOGLE_CLOUD_PROJECT_NUMBER || "1001204402150";
export const GCP_LOCATION =
  process.env.GOOGLE_CLOUD_LOCATION || "asia-northeast3";
export const VERTEX_AGENT_DESIGNER_ID =
  process.env.VERTEX_AGENT_DESIGNER_ID || "agent_1792115718565";

export const PRIMARY_ARGON_MODEL = "gemini-4-argon";
export const FAST_AGENT_MODEL = "gemini-3.8-flash";

let cachedClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI {
  if (!cachedClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    cachedClient = new GoogleGenAI(apiKey ? { apiKey } : {});
  }
  return cachedClient;
}
