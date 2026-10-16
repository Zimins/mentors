import { NextRequest, NextResponse } from "next/server";
import { runMentorAgentTurn } from "@/lib/gemini/mentorAgent";
import { adminStore } from "@/lib/admin/adminStore";
import type { MentorRequestMode, StudentLevel } from "@/types/mentor";

const VALID_MODES: MentorRequestMode[] = [
  "chat",
  "auto_recommend",
  "generate_3d",
  "generate_mini_game",
  "generate_small_test",
  "generate_image_explanation",
  "generate_quiz",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");
  const test = searchParams.get("test");

  // If ?prompt=... or ?test=1 is passed, execute a live agent turn directly via GET for quick browser/curl debugging
  if (prompt || test) {
    const start = Date.now();
    const mentorId = searchParams.get("mentorId") || "cs-professor";
    const mentorName = searchParams.get("mentorName") || "Prof. Jun";
    const roleTitle = searchParams.get("roleTitle") || "CS Architecture Professor";
    const subject = searchParams.get("subject") || "Computer Science & Systems Architecture";
    const mode = (searchParams.get("mode") || "chat") as MentorRequestMode;

    const promptConfig = adminStore.getPromptConfig(mentorId);
    const activePersona =
      promptConfig?.systemPersona ||
      "An inspiring, crystal-clear Computer Science Professor mentor who explains systems using 3D spatial models, mini-games, small tests, and visual diagrams.";

    const result = await runMentorAgentTurn({
      mentorId,
      mentorName,
      roleTitle,
      subject,
      systemPersona: activePersona,
      userMessage:
        prompt ||
        "Diagnose my level and propose the best interactive mini-preview (3D preview, mini game, small test, or image explanation) for how stack frames and heap pointers interact!",
      currentLevel: "unassessed",
      history: [],
      mode: VALID_MODES.includes(mode) ? mode : "chat",
    });

    return NextResponse.json({
      ...result,
      debugMeta: {
        latencyMs: Date.now() - start,
        endpoint: "/api/mentor/chat",
        method: "GET",
      },
    });
  }

  return NextResponse.json({
    endpoint: "/api/mentor/chat",
    status: "ready",
    description:
      "Autonomous AI Mentor Agent turn endpoint with Gemini 4 Argon Adaptive Learning Material Proposal (3d_preview, mini_game, small_test, image_explanation)",
    quickTestGetUrl:
      "http://localhost:3000/api/mentor/chat?test=1&prompt=Explain+binary+trees+with+a+mini+game",
    webDebuggerUrl: "http://localhost:3000/lab",
    adminDashboardUrl: "http://localhost:3000/admin",
    gcpStatusUrl: "http://localhost:3000/api/gcp/status",
  });
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const {
      userId = "demo-scholar-01",
      mentorId = "cs-professor",
      mentorName = "Prof. Jun",
      roleTitle = "CS Architecture Professor",
      subject = "Computer Science & Architecture",
      systemPersona = "An inspiring, crystal-clear Computer Science Professor mentor",
      userMessage = "Assess my CS level and visualize how pointers and stack/heap memory work!",
      currentLevel = "unassessed",
      history = [],
      mode = "chat",
    } = body || {};

    // 1. Fetch expert prompt tuning & custom directives from adminStore
    const promptConfig = adminStore.getPromptConfig(mentorId);
    let effectivePersona = promptConfig?.systemPersona || systemPersona;

    const studentDirective = promptConfig?.studentDirectives?.[userId];
    if (studentDirective) {
      effectivePersona += `\n[HUMAN EXPERT INSTRUCTION FOR LEARNER ${userId}]: ${studentDirective}`;
    }

    // 2. Fetch expert reference materials for grounding
    const references = adminStore.getReferences(mentorId);
    if (references.length > 0) {
      const refSnippet = references
        .slice(0, 2)
        .map((r) => `[Reference Doc: ${r.title}]\n${r.content.slice(0, 600)}...`)
        .join("\n\n");
      effectivePersona += `\n[EXPERT GROUNDING KNOWLEDGE BASE]:\n${refSnippet}`;
    }

    // 3. Execute turn via Gemini 4 Argon
    const validatedMode: MentorRequestMode = VALID_MODES.includes(
      mode as MentorRequestMode
    )
      ? (mode as MentorRequestMode)
      : "chat";

    const result = await runMentorAgentTurn({
      mentorId: String(mentorId),
      mentorName: String(mentorName),
      roleTitle: String(roleTitle),
      subject: String(subject),
      systemPersona: effectivePersona,
      userMessage: String(userMessage),
      currentLevel: (["unassessed", "beginner", "intermediate", "advanced"].includes(
        currentLevel
      )
        ? currentLevel
        : "unassessed") as StudentLevel,
      history: Array.isArray(history) ? history : [],
      mode: validatedMode,
    });

    // 4. Log session turns to adminStore
    const intent =
      validatedMode === "generate_3d"
        ? "request_3d"
        : validatedMode === "generate_quiz" || validatedMode === "generate_small_test"
        ? "challenge_quiz"
        : "ask_concept";

    adminStore.recordSessionLog({
      id: `log-usr-${Date.now()}`,
      userId: String(userId),
      mentorId: String(mentorId),
      role: "user",
      text: String(userMessage),
      studentIntent: intent,
      timestamp: new Date().toISOString(),
    });

    adminStore.recordSessionLog({
      id: `log-men-${Date.now()}`,
      userId: String(userId),
      mentorId: String(mentorId),
      role: "mentor",
      text: result.replyText,
      scene3dTitle: result.learningMaterial?.title || result.scene3d?.title,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ...result,
      debugMeta: {
        latencyMs: Date.now() - start,
        endpoint: "/api/mentor/chat",
        method: "POST",
        humanExpertDirectiveApplied: Boolean(studentDirective),
        referencesGroundedCount: references.length,
      },
    });
  } catch (err) {
    console.error("[/api/mentor/chat] Error:", err);
    return NextResponse.json(
      { error: "Failed to process mentor agent turn", details: String(err) },
      { status: 500 }
    );
  }
}
