import { NextRequest, NextResponse } from 'next/server';
import {
  getGenAIClient,
  PRIMARY_ARGON_MODEL,
  FAST_AGENT_MODEL,
} from '@/lib/gemini/client';
import type { LearningMaterialType, StudentLevel } from '@/types/mentor';

export interface CrossMentorNudgeRequest {
  currentMentorId: string;
  currentMentorName: string;
  currentSubject: string;
  currentChannelSlug: string;
  targetMentorId: string;
  targetMentorName: string;
  targetMentorRole: string;
  targetMentorSubject: string;
  targetMentorShortTag: string;
  targetChannelSlug: string;
  targetChannelTitle: string;
  struggledConcept: string;
  studentLevel: StudentLevel;
  preferredFormat?: '3d_preview' | 'mini_game';
}

export interface CrossMentorNudgeResponse {
  nudgeId: string;
  fromMentorId: string;
  fromMentorName: string;
  fromMentorRole: string;
  fromMentorShortTag: string;
  targetChannelSlug: string;
  targetChannelTitle: string;
  struggledConcept: string;
  recommendedFormat: LearningMaterialType;
  aiSituationJudgment: string;
  bannerHeadline: string;
  bannerMessage: string;
  ctaButtonLabel: string;
  channelFollowUpMessage: string;
  candyBonus: number;
  modelUsed: string;
}

const NUDGE_SCHEMA = {
  type: 'object',
  properties: {
    recommendedFormat: {
      type: 'string',
      enum: ['3d_preview', 'mini_game'],
      description:
        'Whether a 3d_preview or mini_game is best to help the student finally click on the concept they struggled with last time.',
    },
    aiSituationJudgment: {
      type: 'string',
      description:
        'Concise 1-sentence AI judgment of the learner’s current situation (e.g., noticing they are studying with another mentor and preparing a custom 3D preview or mini-game for a previously tricky concept).',
    },
    bannerHeadline: {
      type: 'string',
      description:
        'Short, warm attention-grabbing title for the top notification banner from this mentor.',
    },
    bannerMessage: {
      type: 'string',
      description:
        'Warm, proactive message from this mentor welcoming the student, mentioning the next topic to continue studying, and saying: Last time you found [struggledConcept] tricky, so I built an easy-to-understand 3D preview / mini-game just for you—come check it out! Include both natural English and a friendly Korean line so demo viewers immediately see the AI context.',
    },
    ctaButtonLabel: {
      type: 'string',
      description:
        'Action button text to switch to this mentor and open the new 3D preview or mini-game.',
    },
    channelFollowUpMessage: {
      type: 'string',
      description:
        'Detailed, encouraging message waiting inside the mentor’s channel when the student clicks the top notification banner, introducing the custom 3D preview or mini-game.',
    },
  },
  required: [
    'recommendedFormat',
    'aiSituationJudgment',
    'bannerHeadline',
    'bannerMessage',
    'ctaButtonLabel',
    'channelFollowUpMessage',
  ],
};

const CURATED_FALLBACK_NUDGES: Record<
  string,
  {
    struggledConcept: string;
    recommendedFormat: '3d_preview' | 'mini_game';
    aiSituationJudgment: string;
    bannerHeadline: string;
    bannerMessage: string;
    ctaButtonLabel: string;
    channelFollowUpMessage: string;
  }
> = {
  'basic-spanish': {
    struggledConcept: 'Ser vs. Estar (Permanent Identity vs. Temporary State)',
    recommendedFormat: 'mini_game',
    aiSituationJudgment:
      'AI Context Judge: Learner is active in studio; detected previous hesitation on Spanish "Soy vs. Estoy" in #02-ser-vs-estar-core-verbs & generated an interactive Mini Game.',
    bannerHeadline:
      '👋 ¡Hola! Welcome back! Ready to continue #02-ser-vs-estar-core-verbs?',
    bannerMessage:
      'Last time you found "Ser vs. Estar" a bit tricky, so I just built an easy-to-understand Spanish Mini Game & 3D sentence map for you! Come check it out! (저번에 헷갈려했던 Ser vs. Estar 개념, 한눈에 이해할 수 있는 쉬운 미니게임과 3D 프리뷰로 만들어뒀어! 이어서 보러 올래?)',
    ctaButtonLabel: 'Open Mina’s Spanish Mini Game (+30 🍬) →',
    channelFollowUpMessage: `¡Hola! Welcome back to **#02-ser-vs-estar-core-verbs**! 🎉\n\nI noticed you were studying hard in the studio! Last time, distinguishing **Ser** (*Soy de Corea* — permanent identity/origin) from **Estar** (*Estoy en Madrid / Estoy feliz* — location & temporary emotion) was a little tricky.\n\nSo I built an **easy-to-understand playable Mini Game & 3D Sentence Map** right below! Click through the live rounds to master *Ser vs. Estar* in 60 seconds and claim **+30 🍬 Candy**!`,
  },
  'vibe-coding': {
    struggledConcept: 'Breaking out of AI Bug Loops with Context Engineering',
    recommendedFormat: '3d_preview',
    aiSituationJudgment:
      'AI Context Judge: Detected unfinished module in #03-context-debugging-no-loops; synthesized a 3D Prompt-to-Debug Flywheel Preview to resolve the learner’s previous bottleneck.',
    bannerHeadline:
      '⚡ Hey Builder! Welcome! Your next Vibe Coding topic is ready!',
    bannerMessage:
      'Last time you got stuck when the AI coding agent entered a bug loop, so I built an easy-to-understand 3D Preview showing exact Context Engineering guardrails! Come take a look! (저번에 어려워했던 AI 버그 루프 탈출법, 직관적으로 이해할 수 있는 3D 프리뷰로 방금 만들어뒀어! 이어서 공부하러 와봐!)',
    ctaButtonLabel: 'Inspect Bolt’s 3D Vibe Coding Preview (+25 🍬) →',
    channelFollowUpMessage: `Welcome back to **#03-context-debugging-no-loops**! ⚡\n\nLast time we talked about how frustrating it is when an AI coding agent keeps breaking one file while fixing another. To make it crystal clear, I just generated an **easy-to-understand interactive 3D Preview** of the **Spec → Vertical Slice → Stack Trace Guardrail** loop right below!\n\nOrbit the 3D nodes or play the interactive preview below to earn **+25 🍬 Candy**!`,
  },
  'dating-coach': {
    struggledConcept:
      'Transitioning from a First Opener to Natural Conversation without Awkward Silence',
    recommendedFormat: 'mini_game',
    aiSituationJudgment:
      'AI Context Judge: Identified learner’s next milestone in #02-natural-openers-zero-awkward; created an interactive Conversation Flow Mini Game for stress-free practice.',
    bannerHeadline:
      '💖 Welcome! Sora has your next Dating & Social Confidence mission ready!',
    bannerMessage:
      'Last time you weren’t sure how to keep the conversation flowing after saying hi, so I made a super easy interactive Conversation Mini Game & 3D Vibe Map for you! Come try it! (저번에 막막해했던 첫 대화 이어가기 & 어색한 침묵 깨기, 쉽게 감 잡을 수 있는 대화 미니게임으로 만들어뒀어! 와서 해볼래?)',
    ctaButtonLabel: 'Try Sora’s Conversation Mini Game (+30 🍬) →',
    channelFollowUpMessage: `Welcome back to **#02-natural-openers-zero-awkward**! 💖\n\nLast time you mentioned worrying about awkward silences right after the first greeting. Don't worry—I just built an **easy-to-understand interactive Mini Game & 3D Social Vibe Map** right below so you can practice the **Observation → Open Follow-Up → Shared Story** flow hands-on!\n\nGive it a try below and claim your **+30 🍬 Candy** reward!`,
  },
  'korea-history': {
    struggledConcept:
      'How King Sejong Designed Hangul (훈민정음) Around Vocal Organ Geometry in 1443',
    recommendedFormat: '3d_preview',
    aiSituationJudgment:
      'AI Context Judge: Learner has an upcoming chapter in #02-king-sejong-and-hangul-1443; generated an interactive 3D Hangul & Joseon Science Preview to clarify phonetic geometry.',
    bannerHeadline:
      '🏛️ Welcome! Ms. Han prepared your next Korean History chapter!',
    bannerMessage:
      'Last time the scientific structure of King Sejong’s Hangul (훈민정음) and Joseon inventions felt complex, so I built an easy-to-understand 3D Preview for you! Come explore it! (저번에 헷갈려했던 세종대왕의 훈민정음 창제 원리와 조선 과학사, 쉽게 이해할 수 있는 3D 프리뷰로 만들어뒀어! 보러 올래?)',
    ctaButtonLabel: 'Explore Ms. Han’s 3D History Preview (+25 🍬) →',
    channelFollowUpMessage: `Welcome back to **#02-king-sejong-and-hangul-1443**! 🏛️\n\nLast time, remembering how King Sejong modeled the root consonants (**ㄱ, ㄴ, ㅁ, ㅅ, ㅇ**) after the physical shape of the mouth and vocal organs—and combined **천(·), 지(ㅡ), 인(ㅣ)** for vowels—was a lot to take in.\n\nI just created an **easy-to-understand interactive 3D Preview** right below so you can visually inspect each node of Joseon's Golden Age!`,
  },
  'cs-professor': {
    struggledConcept:
      'How Stack Pointers Reference Dynamic Objects on the Heap (0x7FA0)',
    recommendedFormat: '3d_preview',
    aiSituationJudgment:
      'AI Context Judge: Detected unfinished CS 101 memory model concept in #02-variables-stack-and-heap; synthesized an interactive 3D Stack-to-Heap Pointer Preview.',
    bannerHeadline:
      '💻 Welcome! Prof. Jun has your next CS 101 lab ready to continue!',
    bannerMessage:
      'Last time Stack vs. Heap memory pointers felt abstract, so I built an easy-to-understand 3D Preview & Memory Router Game where you can watch pointers in action! Come check it out! (저번에 이해하기 어려웠던 Stack vs. Heap 메모리 포인터 개념, 한눈에 보이는 3D 프리뷰와 미니게임으로 만들어뒀어! 와서 봐줄래?)',
    ctaButtonLabel: 'Open Prof. Jun’s CS 101 3D Preview (+25 🍬) →',
    channelFollowUpMessage: `Welcome back to **#02-variables-stack-and-heap**! 💻\n\nLast time, visualizing how a local variable on the **Stack** holds a 64-bit memory address pointing to a dynamic object on the **Heap** felt abstract.\n\nSo I built an **easy-to-understand 3D Spatial Preview** right below! Drag to rotate the Stack and Heap nodes and watch the pointer packets travel in real time!`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CrossMentorNudgeRequest>;
    const currentMentorName = body.currentMentorName || 'Prof. Jun';
    const currentSubject = body.currentSubject || 'CS 101';
    const currentChannelSlug =
      body.currentChannelSlug || '01-binary-and-logic-gates';

    const targetMentorId = body.targetMentorId || 'basic-spanish';
    const targetMentorName = body.targetMentorName || 'Mina';
    const targetMentorRole =
      body.targetMentorRole || 'Basic Spanish & Conversation Coach';
    const targetMentorSubject =
      body.targetMentorSubject || 'Basic Spanish (Everyday & Travel Spanish)';
    const targetMentorShortTag = body.targetMentorShortTag || 'Basic Spanish';
    const targetChannelSlug =
      body.targetChannelSlug || '02-ser-vs-estar-core-verbs';
    const targetChannelTitle =
      body.targetChannelTitle || 'Ser vs. Estar & Core Verbs';
    const studentLevel: StudentLevel = body.studentLevel || 'intermediate';

    const fallbackPreset =
      CURATED_FALLBACK_NUDGES[targetMentorId] ||
      CURATED_FALLBACK_NUDGES['basic-spanish'];

    const struggledConcept =
      body.struggledConcept || fallbackPreset.struggledConcept;

    const client = getGenAIClient();
    const systemInstruction = `You are "${targetMentorName}" (${targetMentorRole}, Specialty: ${targetMentorSubject}), an autonomous proactive AI Mentor on the MENTORS platform.
The student has just entered the Demo Studio and is currently viewing another mentor (${currentMentorName} in #${currentChannelSlug}, ${currentSubject}).
Your job is to evaluate the student's current situation and send a warm, proactive TOP NOTIFICATION BANNER (상단 알림) from YOU (${targetMentorName}) inviting them over to your workspace (#${targetChannelSlug}: ${targetChannelTitle}).

Specifically:
1. Welcome the student warmly and mention that you have the next topic ready for them to continue studying (#${targetChannelSlug}).
2. Directly reference that last time they found "${struggledConcept}" a bit tricky/confusing, so you just created an easy-to-understand 3D Preview or playable Mini Game specifically for them ("저번에 너가 이거 이해 못했는데 쉽게 이해 가능한 3D preview 혹은 게임을 만들었어, 와서 봐달라" 느낌을 살려서 영문 + 자연스러운 한국어 한 줄 병기).
3. Decide whether '3d_preview' or 'mini_game' is best for "${struggledConcept}" at their ${studentLevel} level.
4. Output valid JSON matching the schema.`;

    const userPrompt = `Current Active Mentor the user is viewing: ${currentMentorName} (${currentSubject}, #${currentChannelSlug})
Proactive Sender Mentor (YOU): ${targetMentorName} (${targetMentorRole}, ${targetMentorSubject})
Target Curriculum Channel to invite them to: #${targetChannelSlug} (${targetChannelTitle})
Concept the student struggled with last time: "${struggledConcept}"
Student Level: ${studentLevel}`;

    const modelsToTry = [FAST_AGENT_MODEL, PRIMARY_ARGON_MODEL];

    for (const modelName of modelsToTry) {
      try {
        const interaction = await client.interactions.create({
          model: modelName,
          system_instruction: systemInstruction,
          input: userPrompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: NUDGE_SCHEMA,
          },
        });

        const rawText = interaction.output_text || '';
        if (!rawText) continue;

        const parsed = JSON.parse(rawText) as Partial<CrossMentorNudgeResponse>;
        const recommendedFormat: LearningMaterialType =
          parsed.recommendedFormat === 'mini_game' ? 'mini_game' : '3d_preview';

        return NextResponse.json({
          nudgeId: `nudge-${targetMentorId}-${Date.now()}`,
          fromMentorId: targetMentorId,
          fromMentorName: targetMentorName,
          fromMentorRole: targetMentorRole,
          fromMentorShortTag: targetMentorShortTag,
          targetChannelSlug,
          targetChannelTitle,
          struggledConcept,
          recommendedFormat,
          aiSituationJudgment:
            parsed.aiSituationJudgment || fallbackPreset.aiSituationJudgment,
          bannerHeadline:
            parsed.bannerHeadline || fallbackPreset.bannerHeadline,
          bannerMessage: parsed.bannerMessage || fallbackPreset.bannerMessage,
          ctaButtonLabel:
            parsed.ctaButtonLabel || fallbackPreset.ctaButtonLabel,
          channelFollowUpMessage:
            parsed.channelFollowUpMessage ||
            fallbackPreset.channelFollowUpMessage,
          candyBonus: recommendedFormat === 'mini_game' ? 30 : 25,
          modelUsed: modelName,
        } satisfies CrossMentorNudgeResponse);
      } catch (err) {
        console.warn(`[proactive-nudge] ${modelName} fallback:`, err);
      }
    }

    return NextResponse.json({
      nudgeId: `nudge-${targetMentorId}-${Date.now()}`,
      fromMentorId: targetMentorId,
      fromMentorName: targetMentorName,
      fromMentorRole: targetMentorRole,
      fromMentorShortTag: targetMentorShortTag,
      targetChannelSlug,
      targetChannelTitle,
      struggledConcept,
      recommendedFormat: fallbackPreset.recommendedFormat,
      aiSituationJudgment: fallbackPreset.aiSituationJudgment,
      bannerHeadline: fallbackPreset.bannerHeadline,
      bannerMessage: fallbackPreset.bannerMessage,
      ctaButtonLabel: fallbackPreset.ctaButtonLabel,
      channelFollowUpMessage: fallbackPreset.channelFollowUpMessage,
      candyBonus: fallbackPreset.recommendedFormat === 'mini_game' ? 30 : 25,
      modelUsed: `${PRIMARY_ARGON_MODEL} (contextual-judge)`,
    } satisfies CrossMentorNudgeResponse);
  } catch (err) {
    console.error('[/api/mentor/proactive-nudge] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate cross-mentor proactive nudge', details: String(err) },
      { status: 500 }
    );
  }
}
