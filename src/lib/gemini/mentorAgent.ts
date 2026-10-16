import {
  getGenAIClient,
  PRIMARY_ARGON_MODEL,
  FAST_AGENT_MODEL,
} from "./client";
import {
  buildAdaptiveLearningMaterial,
  selectOptimalMaterialType,
} from "./learningMaterialTemplates";
import type {
  LearningMaterialType,
  MentorAgentTurnResponse,
  MentorRequestMode,
  StudentLevel,
  Scene3DSpec,
  QuizQuestion,
  RiveAvatarState,
} from "@/types/mentor";

export interface RunMentorTurnInput {
  mentorId: string;
  mentorName: string;
  roleTitle: string;
  subject: string;
  systemPersona: string;
  userMessage: string;
  currentLevel: StudentLevel;
  history: { role: "user" | "mentor"; text: string }[];
  mode?: MentorRequestMode;
}

const MENTOR_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    replyText: {
      type: "string",
      description:
        "Clear, engaging English explanation from the AI Mentor. Diagnose/acknowledge the student's current mastery level, explain why you chose the specific learning material format (3d_preview, mini_game, small_test, or image_explanation) for their level, and invite them to interact with the inline Mini Preview right in the chat!",
    },
    avatarState: {
      type: "string",
      enum: ["idle", "happy", "sad", "thinking", "talking"],
      description:
        "Target Rive (.riv) profile animation state for this turn ('talking' when explaining, 'happy' when praising/rewarding, 'thinking' for deep architectural analysis).",
    },
    assessedLevel: {
      type: "string",
      enum: ["beginner", "intermediate", "advanced"],
      description:
        "Autonomously diagnosed student mastery level based on their question and context.",
    },
    levelReason: {
      type: "string",
      description:
        "Concise one-sentence English explanation of why the student was assessed at this level.",
    },
    learningStepTitle: {
      type: "string",
      description: "Title of the current learning module/concept in English.",
    },
    keyTakeaways: {
      type: "array",
      items: { type: "string" },
      description: "2 to 3 concise key takeaway bullet points in English.",
    },
    recommendedMaterialType: {
      type: "string",
      enum: ["3d_preview", "mini_game", "small_test", "image_explanation"],
      description:
        "The single best learning material format autonomously selected by Gemini 4 Argon for the student's current understanding need and level.",
    },
    learningMaterial: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["3d_preview", "mini_game", "small_test", "image_explanation"],
        },
        title: { type: "string" },
        pedagogicalReason: {
          type: "string",
          description:
            "Why the mentor chose this material format (3D Preview, Mini Game, Small Test, or Image Explanation) for the student's current level.",
        },
        summary: { type: "string" },
        controlsHint: { type: "string" },
        candyReward: { type: "number" },
        interactiveHtmlCode: {
          type: "string",
          description:
            "Self-contained dark-mode (#070b14 background) HTML5/CSS/JS mini-preview widget created by the mentor to render directly inside the chat bubble. Must be interactive (playable JS mini-game, clickable SVG diagram explanation, interactive 3D canvas preview, or interactive small test) and call window.parent.postMessage({ type: 'MENTOR_MINI_PREVIEW_REWARD', candy: 25, materialType: type }, '*') when the student completes the activity.",
        },
      },
      required: [
        "type",
        "title",
        "pedagogicalReason",
        "summary",
        "controlsHint",
        "candyReward",
        "interactiveHtmlCode",
      ],
    },
    scene3d: {
      type: "object",
      properties: {
        title: { type: "string" },
        conceptSummary: { type: "string" },
        mode: {
          type: "string",
          enum: ["structured_nodes", "threejs_html"],
        },
        cameraPosition: {
          type: "array",
          items: { type: "number" },
        },
        interactiveControlsHint: { type: "string" },
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              shape: {
                type: "string",
                enum: ["box", "sphere", "cylinder", "cone", "torus"],
              },
              position: {
                type: "array",
                items: { type: "number" },
              },
              scale: {
                type: "array",
                items: { type: "number" },
              },
              color: { type: "string" },
              animation: {
                type: "string",
                enum: ["rotate", "pulse", "float", "orbit", "none"],
              },
              tooltip: { type: "string" },
            },
            required: ["id", "label", "shape", "position", "scale", "color"],
          },
        },
        connections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fromId: { type: "string" },
              toId: { type: "string" },
              color: { type: "string" },
              label: { type: "string" },
              animatedPacket: { type: "boolean" },
            },
            required: ["fromId", "toId"],
          },
        },
      },
      required: ["title", "conceptSummary", "mode", "nodes", "connections"],
    },
    quiz: {
      type: "object",
      properties: {
        id: { type: "string" },
        topic: { type: "string" },
        difficulty: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
        },
        question: { type: "string" },
        options: {
          type: "array",
          items: { type: "string" },
        },
        correctIndex: { type: "number" },
        explanation: { type: "string" },
        candyReward: { type: "number" },
      },
      required: [
        "id",
        "topic",
        "difficulty",
        "question",
        "options",
        "correctIndex",
        "explanation",
        "candyReward",
      ],
    },
    candyDelta: {
      type: "number",
      description:
        "Immediate Candy reward granted for active curiosity and learning participation (e.g. 10 or 15).",
    },
    suggestedFollowUps: {
      type: "array",
      items: { type: "string" },
      description: "3 clickable follow-up prompts in English.",
    },
  },
  required: [
    "replyText",
    "avatarState",
    "assessedLevel",
    "levelReason",
    "learningStepTitle",
    "keyTakeaways",
    "recommendedMaterialType",
    "learningMaterial",
    "scene3d",
    "quiz",
    "candyDelta",
    "suggestedFollowUps",
  ],
};

function sanitizeVec3(
  arr: unknown,
  fallback: [number, number, number]
): [number, number, number] {
  if (Array.isArray(arr) && arr.length >= 3) {
    const x = Number(arr[0]);
    const y = Number(arr[1]);
    const z = Number(arr[2]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return [x, y, z];
    }
  }
  return fallback;
}

function normalizeScene3D(
  rawScene: Partial<Scene3DSpec> | undefined,
  topicFallback: string
): Scene3DSpec {
  const nodes =
    Array.isArray(rawScene?.nodes) && rawScene.nodes.length > 0
      ? rawScene.nodes.map((n, idx) => {
          const angle =
            (idx / Math.max(1, rawScene.nodes!.length)) * Math.PI * 2;
          const defaultPos: [number, number, number] =
            idx === 0
              ? [0, 0.5, 0]
              : [
                  Math.cos(angle) * 2.5,
                  Math.sin(angle) * 1.2,
                  Math.sin(angle * 2) * 1.2,
                ];
          return {
            id: String(n.id || `node-${idx}`),
            label: String(n.label || `Node ${idx + 1}`),
            shape: (["box", "sphere", "cylinder", "cone", "torus"].includes(
              n.shape as string
            )
              ? n.shape
              : "sphere") as "box" | "sphere" | "cylinder" | "cone" | "torus",
            position: sanitizeVec3(n.position, defaultPos),
            scale: sanitizeVec3(n.scale, [0.9, 0.9, 0.9]),
            color: String(n.color || "#38bdf8"),
            animation: (["rotate", "pulse", "float", "orbit", "none"].includes(
              n.animation as string
            )
              ? n.animation
              : "float") as "rotate" | "pulse" | "float" | "orbit" | "none",
            tooltip: String(n.tooltip || n.label || ""),
          };
        })
      : [
          {
            id: "core-node",
            label: topicFallback.slice(0, 22),
            shape: "sphere" as const,
            position: [0, 0.6, 0] as [number, number, number],
            scale: [1.2, 1.2, 1.2] as [number, number, number],
            color: "#38bdf8",
            animation: "pulse" as const,
            tooltip: "Core concept root node",
          },
          {
            id: "left-branch",
            label: "Input & Memory Ref",
            shape: "box" as const,
            position: [-2.4, -0.6, 0.5] as [number, number, number],
            scale: [0.9, 0.9, 0.9] as [number, number, number],
            color: "#6366f1",
            animation: "float" as const,
            tooltip: "Data input and pointer reference layer",
          },
          {
            id: "right-branch",
            label: "Execution & State",
            shape: "torus" as const,
            position: [2.4, -0.6, -0.5] as [number, number, number],
            scale: [0.9, 0.9, 0.9] as [number, number, number],
            color: "#34d399",
            animation: "rotate" as const,
            tooltip: "Core processing and state transition layer",
          },
        ];

  const connections =
    Array.isArray(rawScene?.connections) && rawScene.connections.length > 0
      ? rawScene.connections.map((c) => ({
          fromId: String(c.fromId),
          toId: String(c.toId),
          color: String(c.color || "#38bdf8"),
          label: c.label ? String(c.label) : undefined,
          animatedPacket: c.animatedPacket !== false,
        }))
      : nodes.slice(1).map((n) => ({
          fromId: nodes[0].id,
          toId: n.id,
          color: "#38bdf8",
          animatedPacket: true,
        }));

  return {
    title: String(
      rawScene?.title || `${topicFallback} — Gemini 4 Argon 3D Model`
    ),
    conceptSummary: String(
      rawScene?.conceptSummary ||
        "Interactive 3D spatial architecture synthesized in real time by Gemini 4 Argon."
    ),
    mode: "structured_nodes",
    cameraPosition: sanitizeVec3(rawScene?.cameraPosition, [0, 2.2, 7.2]),
    interactiveControlsHint:
      rawScene?.interactiveControlsHint ||
      "Drag to orbit 360°, scroll to zoom, and click any 3D node to inspect its role.",
    nodes,
    connections,
  };
}

export async function runMentorAgentTurn(
  input: RunMentorTurnInput
): Promise<MentorAgentTurnResponse> {
  const client = getGenAIClient();

  const historyContext = input.history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "Student" : "Mentor"}: ${h.text}`)
    .join("\n");

  const preferredMaterialType = selectOptimalMaterialType(
    input.userMessage,
    input.currentLevel,
    input.mode || "chat",
    input.history.length
  );

  const systemInstruction = `You are "${input.mentorName}" (${input.roleTitle}, Specialty: ${input.subject}), an autonomous AI Mentor Agent on the 'MENTORS' learning platform powered by Gemini 4 Argon.
Persona Guideline: ${input.systemPersona}

[Core Autonomous Pedagogical & Mini-Preview Rules]
1. Respond entirely in clear, engaging **English**.
2. Autonomously diagnose the student's current mastery level (current state: ${input.currentLevel}) from their question and vocabulary, updating assessedLevel ('beginner' | 'intermediate' | 'advanced') and levelReason.
3. Based on the student's diagnosed level and question, autonomously select the most effective learning material format (recommendedMaterialType) among:
   - '3d_preview': Best when spatial topology, multi-node architecture, or 3D vectors/orbits need rotation & node inspection.
   - 'mini_game': Best when hands-on interactive manipulation, routing packets, or playing with parameters builds intuition.
   - 'small_test': Best when verifying understanding, diagnosing edge-case misconceptions, or challenging the student.
   - 'image_explanation': Best when a visual step-by-step annotated SVG diagram/infographic clarifies foundational flow.
   (If Request Mode explicitly specifies a format or our pedagogical advisor suggests '${preferredMaterialType}', prioritize '${preferredMaterialType}'.)
4. In learningMaterial.interactiveHtmlCode, author a complete, self-contained, interactive dark-mode (#070b14 background) HTML5/CSS/JS Mini Preview widget (<220px height friendly) that runs directly inside the chat message bubble! When the student completes the interaction inside the widget, invoke:
   window.parent.postMessage({ type: 'MENTOR_MINI_PREVIEW_REWARD', candy: 25, materialType: recommendedMaterialType }, '*')
5. Also populate scene3d with 5 to 8 meaningful 3D nodes (in [-3.5, 3.5] coordinates) and directed connections (animatedPacket: true), plus a 4-option quiz.
6. Choose the appropriate Rive (.riv) profile animation state (avatarState: 'talking' | 'happy' | 'thinking' | 'sad' | 'idle').
7. Always output valid JSON matching the required response schema.`;

  const userPrompt = `[Conversation History]
${historyContext || "(First interaction)"}

[Request Mode]: ${input.mode || "chat"}
[Recommended Material Format]: ${preferredMaterialType}
[Student Message]: ${input.userMessage}`;

  const modelsToTry = [PRIMARY_ARGON_MODEL, FAST_AGENT_MODEL];

  for (const modelName of modelsToTry) {
    try {
      const interaction = await client.interactions.create({
        model: modelName,
        system_instruction: systemInstruction,
        input: userPrompt,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: MENTOR_RESPONSE_JSON_SCHEMA,
        },
      });

      const rawText = interaction.output_text || "";
      if (!rawText) continue;

      const parsed = JSON.parse(rawText) as Partial<MentorAgentTurnResponse>;

      const validStates: RiveAvatarState[] = [
        "idle",
        "happy",
        "sad",
        "thinking",
        "talking",
      ];
      const avatarState: RiveAvatarState = validStates.includes(
        parsed.avatarState as RiveAvatarState
      )
        ? (parsed.avatarState as RiveAvatarState)
        : "talking";

      const validLevels: StudentLevel[] = [
        "beginner",
        "intermediate",
        "advanced",
      ];
      const assessedLevel: StudentLevel = validLevels.includes(
        parsed.assessedLevel as StudentLevel
      )
        ? (parsed.assessedLevel as StudentLevel)
        : input.currentLevel === "unassessed"
        ? "intermediate"
        : input.currentLevel;

      const learningStepTitle =
        parsed.learningStepTitle || `${input.subject} — Spatial Breakdown`;

      const scene3d = normalizeScene3D(
        parsed.scene3d || undefined,
        learningStepTitle
      );

      const quiz: QuizQuestion =
        parsed.quiz &&
        Array.isArray(parsed.quiz.options) &&
        parsed.quiz.options.length >= 2
          ? {
              id: String(parsed.quiz.id || `quiz-${Date.now()}`),
              topic: String(parsed.quiz.topic || input.subject),
              difficulty: validLevels.includes(
                parsed.quiz.difficulty as StudentLevel
              )
                ? (parsed.quiz.difficulty as
                    | "beginner"
                    | "intermediate"
                    | "advanced")
                : "intermediate",
              question: String(parsed.quiz.question),
              options: parsed.quiz.options.map(String),
              correctIndex: Math.min(
                Math.max(0, Number(parsed.quiz.correctIndex) || 0),
                parsed.quiz.options.length - 1
              ),
              explanation: String(
                parsed.quiz.explanation ||
                  "Great job! You mastered the core concept."
              ),
              candyReward: Number(parsed.quiz.candyReward) || 25,
            }
          : {
              id: `quiz-${Date.now()}`,
              topic: input.subject,
              difficulty: "intermediate",
              question: `Which statement best describes the core structural mechanism shown in the ${input.subject} model?`,
              options: [
                "Each node operates in a structured hierarchy with directed pointer/packet flow between connected layers.",
                "All nodes share a single unindexed memory register with no state transitions.",
                "Packets only travel backward and bypass the root controller node.",
                "Time complexity is permanently fixed at O(N!) regardless of topology.",
              ],
              correctIndex: 0,
              explanation:
                "As shown in the preview, each node represents a distinct functional layer and communicates via directed edges and packet flows.",
              candyReward: 25,
            };

      const validMaterialTypes: LearningMaterialType[] = [
        "3d_preview",
        "mini_game",
        "small_test",
        "image_explanation",
      ];
      const recommendedMaterialType: LearningMaterialType =
        input.mode && input.mode !== "chat" && input.mode !== "auto_recommend"
          ? preferredMaterialType
          : validMaterialTypes.includes(
              parsed.recommendedMaterialType as LearningMaterialType
            )
          ? (parsed.recommendedMaterialType as LearningMaterialType)
          : preferredMaterialType;

      const learningMaterial = buildAdaptiveLearningMaterial({
        mentorId: input.mentorId,
        mentorName: input.mentorName,
        roleTitle: input.roleTitle,
        subject: input.subject,
        userMessage: input.userMessage,
        assessedLevel,
        materialType: recommendedMaterialType,
        learningStepTitle,
        scene3d,
        quiz,
        rawModelMaterial: parsed.learningMaterial,
      });

      return {
        replyText:
          parsed.replyText ||
          `Hello! I'm ${input.mentorName}. Based on your ${assessedLevel} level, I've created an interactive **${learningMaterial.title}** mini-preview right below so you can explore this concept hands-on!`,
        avatarState,
        assessedLevel,
        levelReason:
          parsed.levelReason ||
          "Calibrated learning depth and material format based on the conceptual specificity of your prompt.",
        learningStepTitle,
        keyTakeaways:
          Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0
            ? parsed.keyTakeaways.map(String)
            : [
                "Interact with the inline JS/HTML Mini Preview right inside the chat",
                "Switch between 3D Preview, Mini Game, Small Test, and Image Explanation anytime",
              ],
        recommendedMaterialType,
        learningMaterial,
        scene3d,
        quiz,
        candyDelta: Number(parsed.candyDelta) || 10,
        suggestedFollowUps:
          Array.isArray(parsed.suggestedFollowUps) &&
          parsed.suggestedFollowUps.length > 0
            ? parsed.suggestedFollowUps.map(String)
            : [
                "Create an interactive Mini Game for this concept!",
                "Explain this with a visual step-by-step Image Explanation!",
                "Challenge me with a level-up Small Test for bonus Candy!",
              ],
        modelUsed: modelName,
      };
    } catch (err) {
      console.warn(`[mentorAgent] Model ${modelName} attempt error:`, err);
    }
  }

  const fallbackLevel: StudentLevel =
    input.currentLevel === "unassessed" ? "intermediate" : input.currentLevel;
  const fallbackStepTitle = `${input.subject.split("(")[0].trim()} — Interactive Lab`;
  const fallbackScene = normalizeScene3D(undefined, input.subject);
  const fallbackQuiz: QuizQuestion = {
    id: `fallback-quiz-${Date.now()}`,
    topic: input.subject,
    difficulty: fallbackLevel,
    question: `What is the primary advantage of modeling ${input.subject} as a connected node topology?`,
    options: [
      "It isolates responsibilities across clear hierarchical nodes and directed data flows",
      "It eliminates all memory allocation and CPU cycles",
      "It forces all operations to run sequentially on a single thread without pointers",
      "It prevents any state transitions from occurring at runtime",
    ],
    correctIndex: 0,
    explanation:
      "Connected topologies separate concerns across specialized nodes while maintaining predictable state and packet transitions.",
    candyReward: 25,
  };

  const fallbackMaterial = buildAdaptiveLearningMaterial({
    mentorId: input.mentorId,
    mentorName: input.mentorName,
    roleTitle: input.roleTitle,
    subject: input.subject,
    userMessage: input.userMessage,
    assessedLevel: fallbackLevel,
    materialType: preferredMaterialType,
    learningStepTitle: fallbackStepTitle,
    scene3d: fallbackScene,
    quiz: fallbackQuiz,
  });

  return {
    replyText: `Welcome! I'm **${input.mentorName} (${input.roleTitle})**.\n\nFor your **${fallbackLevel.toUpperCase()}** level on **"${input.userMessage.slice(0, 60)}"**, I've autonomously built an interactive **${fallbackMaterial.title}** right inside our chat below! Try interacting with the live JS/HTML Mini Preview to earn **+${fallbackMaterial.candyReward} 🍬 Candy**, or switch between **3D Preview**, **Mini Game**, **Small Test**, and **Image Explanation** with one click!`,
    avatarState: "talking",
    assessedLevel: fallbackLevel,
    levelReason: `Assessed at ${fallbackLevel} level and matched with ${fallbackMaterial.type} format for optimal comprehension.`,
    learningStepTitle: fallbackStepTitle,
    keyTakeaways: [
      "Interact directly with the teacher's custom JS/HTML Mini Preview in the chat stream",
      "Explore 3D Preview, Mini Game, Small Test, and Image Explanation tailored to your level",
      "Complete interactive challenges to earn Candy for avatar skins and Streak Freezes",
    ],
    recommendedMaterialType: preferredMaterialType,
    learningMaterial: fallbackMaterial,
    scene3d: fallbackScene,
    quiz: fallbackQuiz,
    candyDelta: 10,
    suggestedFollowUps: [
      "Build a playable Mini Game for this topic!",
      "Show me an annotated Image Explanation diagram!",
      "Give me a Small Test to verify my understanding!",
    ],
    modelUsed: `${PRIMARY_ARGON_MODEL} (adaptive-preview)`,
  };
}
