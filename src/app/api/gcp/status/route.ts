import { NextResponse } from "next/server";
import {
  GCP_LOCATION,
  GCP_PROJECT_ID,
  GCP_PROJECT_NUMBER,
  PRIMARY_ARGON_MODEL,
  FAST_AGENT_MODEL,
  VERTEX_AGENT_DESIGNER_ID,
} from "@/lib/gemini/client";

export async function GET() {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    ok: true,
    gcpProject: {
      projectId: GCP_PROJECT_ID,
      projectNumber: GCP_PROJECT_NUMBER,
      projectName: "H2 KR GDM AI hack-2694",
      region: GCP_LOCATION,
      vertexAgentDesignerId: VERTEX_AGENT_DESIGNER_ID,
      agentStudioConsoleUrl: `https://console.cloud.google.com/agent-platform/studio/agent-designer/edit/${VERTEX_AGENT_DESIGNER_ID}?project=${GCP_PROJECT_ID}`,
    },
    geminiModels: {
      primaryReasoningAnd3D: PRIMARY_ARGON_MODEL,
      fastAgentFallback: FAST_AGENT_MODEL,
      apiKeyConfigured: hasApiKey,
      sdk: "@google/genai (Interactions API)",
    },
    servicesEnabled: [
      "aiplatform.googleapis.com",
      "agentregistry.googleapis.com",
      "generativelanguage.googleapis.com",
      "run.googleapis.com",
      "firestore.googleapis.com",
    ],
    timestamp: new Date().toISOString(),
  });
}
