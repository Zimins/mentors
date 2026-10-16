import { NextRequest, NextResponse } from 'next/server';
import { getGenAIClient } from '@/lib/gemini/client';
import {
  CANDY_DISC_PALETTES,
  matchAvatarByParts,
  recommendAvatarPartsForTopic,
} from '@/data/characterParts';
import type { AvatarPartsConfig, Scene3DSpec } from '@/types/mentor';

const GENERATE_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Catchy, memorable mentor name (e.g., "Prof. Nova", "Coach Ray", "Dr. Lina").',
    },
    roleTitle: {
      type: 'string',
      description: 'Concise professional role title (e.g., "Rust Async Systems Architect").',
    },
    shortTag: {
      type: 'string',
      description: 'Short 1-2 word badge label under 16 chars (e.g., "Rust Async").',
    },
    description: {
      type: 'string',
      description: '1-2 sentence engaging overview of how this mentor teaches the subject.',
    },
    systemPersona: {
      type: 'string',
      description:
        'Detailed system prompt instructing the AI mentor on tone, diagnostic method, 3D spatial analogies, and progressive curriculum guidance.',
    },
    starterPrompts: {
      type: 'array',
      items: { type: 'string' },
      description: '3 to 4 specific starter questions a student can click to begin.',
    },
    customChannels: {
      type: 'array',
      items: { type: 'string' },
      description:
        '4 progressive Slack-style curriculum channel slugs (e.g., "01-core-foundations", "02-architecture-flow", "03-hands-on-patterns", "04-mastery-challenge").',
    },
    avatarParts: {
      type: 'object',
      properties: {
        archetype: { type: 'string', enum: ['human', 'mascot'] },
        hairStyle: {
          type: 'string',
          enum: [
            'short_part',
            'curtain',
            'wavy',
            'bun',
            'twin_tails',
            'braid',
            'bob',
            'afro',
            'ponytail',
            'spiky',
          ],
        },
        headwear: {
          type: 'string',
          enum: [
            'none',
            'mortarboard',
            'beret',
            'beanie',
            'bucket_hat',
            'cap',
            'headband',
          ],
        },
        eyewear: { type: 'string', enum: ['glasses', 'none'] },
        outfit: {
          type: 'string',
          enum: ['tie', 'bowtie', 'blazer', 'scarf', 'hoodie', 'straps', 'collar'],
        },
        charm: {
          type: 'string',
          enum: ['none', 'earrings', 'dimples', 'blush', 'mole'],
        },
        discIndex: { type: 'integer' },
      },
      required: ['archetype', 'hairStyle', 'headwear', 'eyewear', 'outfit', 'charm', 'discIndex'],
    },
    sceneNodes: {
      type: 'array',
      description: '4 key 3D concept nodes representing the core architecture of this topic.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          tooltip: { type: 'string' },
          shape: { type: 'string', enum: ['sphere', 'box', 'torus', 'cylinder', 'cone'] },
        },
        required: ['label', 'tooltip', 'shape'],
      },
    },
  },
  required: [
    'name',
    'roleTitle',
    'shortTag',
    'description',
    'systemPersona',
    'starterPrompts',
    'customChannels',
    'avatarParts',
    'sceneNodes',
  ],
};

function buildFallbackMentorBlueprint(
  topic: string,
  teachingStyle: 'socratic' | 'hands_on' | 'friendly' | 'strict'
) {
  const cleanTopic = topic.trim() || 'Custom AI & Systems';
  const { parts, matchedRig, palette } = recommendAvatarPartsForTopic(
    cleanTopic,
    teachingStyle
  );

  const styleMeta = {
    friendly: {
      prefix: 'Coach',
      tone: 'warm, encouraging, and intuitive with vivid 3D analogies',
    },
    socratic: {
      prefix: 'Prof.',
      tone: 'Socratic, thought-provoking, and guided by diagnostic questions',
    },
    hands_on: {
      prefix: 'Lead',
      tone: 'practical, project-driven, and focused on real-world implementation',
    },
    strict: {
      prefix: 'Dr.',
      tone: 'rigorous, precise, and focused on deep first-principles mastery',
    },
  }[teachingStyle];

  const baseName = matchedRig.label.split(' ')[0] || 'Nova';
  const name = `${styleMeta.prefix} ${baseName}`;
  const shortTag = cleanTopic.slice(0, 16);

  const slugBase = cleanTopic
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 14) || 'topic';

  const customChannels = [
    `01-${slugBase}-foundations`,
    `02-core-architecture-3d`,
    `03-real-world-practice`,
    `04-mastery-quiz-challenge`,
  ];

  const defaultScene3d: Scene3DSpec = {
    title: `${cleanTopic} — 3D Concept Architecture`,
    conceptSummary: `Interactive 3D mental model showing how core principles, execution flow, and mastery checks connect in ${cleanTopic}.`,
    mode: 'structured_nodes',
    cameraPosition: [0, 2.2, 7.2],
    interactiveControlsHint:
      'Drag to rotate 360°, scroll to zoom, and click any 3D concept node to inspect.',
    nodes: [
      {
        id: 'core-hub',
        label: `${cleanTopic} Core`,
        shape: 'sphere',
        position: [0, 0.3, 0],
        scale: [1.3, 1.3, 1.3],
        color: palette.accent,
        animation: 'pulse',
        tooltip: `Central mental model and core mechanism of ${cleanTopic}`,
      },
      {
        id: 'node-foundations',
        label: '1. First Principles',
        shape: 'box',
        position: [-2.4, 1.0, 0],
        scale: [1.0, 0.9, 1.0],
        color: palette.secondary,
        animation: 'float',
        tooltip: `Foundational building blocks and terminology for ${cleanTopic}`,
      },
      {
        id: 'node-mechanism',
        label: '2. Live Flow & Pattern',
        shape: 'torus',
        position: [2.4, 1.0, 0],
        scale: [0.95, 0.95, 0.95],
        color: '#34d399',
        animation: 'rotate',
        tooltip: `Step-by-step spatial interaction and real-world pattern in ${cleanTopic}`,
      },
      {
        id: 'node-mastery',
        label: '3. Applied Verification',
        shape: 'cone',
        position: [0, -1.9, 0.6],
        scale: [0.95, 0.95, 0.95],
        color: '#f59e0b',
        animation: 'float',
        tooltip: `Diagnostic quiz & hands-on synthesis for ${cleanTopic}`,
      },
    ],
    connections: [
      {
        fromId: 'node-foundations',
        toId: 'core-hub',
        color: palette.accent,
        animatedPacket: true,
        label: 'Foundation',
      },
      {
        fromId: 'core-hub',
        toId: 'node-mechanism',
        color: '#34d399',
        animatedPacket: true,
        label: 'Execution',
      },
      {
        fromId: 'core-hub',
        toId: 'node-mastery',
        color: '#f59e0b',
        animatedPacket: true,
        label: 'Mastery Check',
      },
    ],
  };

  return {
    name,
    roleTitle: `${cleanTopic} Specialist Mentor`,
    subject: cleanTopic,
    shortTag,
    description: `Proactive AI mentor tailored to ${cleanTopic} (${styleMeta.tone}). Diagnoses your level and builds interactive 3D mental models.`,
    systemPersona: `You are ${name}, a ${cleanTopic} Specialist Mentor. Your teaching style is ${styleMeta.tone}. Always start by diagnosing the learner's level in "${cleanTopic}", explain concepts clearly with 3D spatial analogies, and guide them step by step across their curriculum channels.`,
    starterPrompts: [
      `Diagnose my current level in ${cleanTopic} with a quick warm-up question!`,
      `Build an interactive 3D mental model of the core concepts in ${cleanTopic}.`,
      `What is the #1 misconception beginners have about ${cleanTopic}?`,
      `Give me a hands-on mini quiz on ${cleanTopic} to earn Candy!`,
    ],
    customChannels,
    avatarParts: parts,
    rivFile: matchedRig.rivFile,
    matchedRigLabel: matchedRig.label,
    accentColor: palette.accent,
    secondaryColor: palette.secondary,
    discBackground: palette.gradient,
    defaultScene3d,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = String(body?.topic || 'Computer Science & AI').trim();
    const teachingStyle = (
      ['socratic', 'hands_on', 'friendly', 'strict'].includes(body?.teachingStyle)
        ? body.teachingStyle
        : 'friendly'
    ) as 'socratic' | 'hands_on' | 'friendly' | 'strict';

    const fallback = buildFallbackMentorBlueprint(topic, teachingStyle);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        ...fallback,
        source: 'instant-combinatorial-engine',
      });
    }

    try {
      const ai = getGenAIClient();
      const prompt = `Design a custom AI Mentor and select combinatorial character avatar parts for a learner who wants to master: "${topic}".
Preferred teaching style: "${teachingStyle}".
Respond in the same language as the topic if Korean is used for description/prompts, or clear English/bilingual as natural. Keep channel slugs in lowercase kebab-case starting with 01-, 02-, 03-, 04-.`;

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: GENERATE_SCHEMA,
            temperature: 0.7,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 4500)
        ),
      ]);

      const rawText = response.text;
      if (!rawText) {
        return NextResponse.json({
          ...fallback,
          source: 'instant-combinatorial-fallback',
        });
      }

      const parsed = JSON.parse(rawText);
      const parts: AvatarPartsConfig = {
        archetype: parsed.avatarParts?.archetype === 'mascot' ? 'mascot' : 'human',
        hairStyle: parsed.avatarParts?.hairStyle || fallback.avatarParts.hairStyle,
        headwear: parsed.avatarParts?.headwear || fallback.avatarParts.headwear,
        eyewear: parsed.avatarParts?.eyewear === 'none' ? 'none' : 'glasses',
        outfit: parsed.avatarParts?.outfit || fallback.avatarParts.outfit,
        charm: parsed.avatarParts?.charm || fallback.avatarParts.charm,
        discIndex:
          typeof parsed.avatarParts?.discIndex === 'number'
            ? Math.abs(parsed.avatarParts.discIndex) % CANDY_DISC_PALETTES.length
            : fallback.avatarParts.discIndex,
      };

      const matchedRig = matchAvatarByParts(parts);
      const palette =
        CANDY_DISC_PALETTES[parts.discIndex % CANDY_DISC_PALETTES.length] ||
        CANDY_DISC_PALETTES[8];

      const positions: Array<[number, number, number]> = [
        [0, 0.4, 0],
        [-2.4, 1.0, 0],
        [2.4, 1.0, 0],
        [0, -1.9, 0.6],
      ];
      const colors = [palette.accent, palette.secondary, '#34d399', '#f59e0b'];

      const nodes =
        Array.isArray(parsed.sceneNodes) && parsed.sceneNodes.length >= 3
          ? parsed.sceneNodes.slice(0, 4).map(
              (
                n: { label?: string; tooltip?: string; shape?: string },
                idx: number
              ) => ({
                id: idx === 0 ? 'core-hub' : `node-${idx}`,
                label: n.label || `Concept ${idx + 1}`,
                shape: (['sphere', 'box', 'torus', 'cylinder', 'cone'].includes(
                  String(n.shape)
                )
                  ? n.shape
                  : idx === 0
                  ? 'sphere'
                  : 'box') as 'sphere' | 'box' | 'torus' | 'cylinder' | 'cone',
                position: positions[idx] || [0, 0, 0],
                scale: idx === 0 ? [1.3, 1.3, 1.3] : [0.95, 0.95, 0.95],
                color: colors[idx % colors.length],
                animation: idx === 0 ? 'pulse' : idx === 2 ? 'rotate' : 'float',
                tooltip: n.tooltip || `${topic} concept node`,
              })
            )
          : fallback.defaultScene3d.nodes;

      return NextResponse.json({
        name: parsed.name || fallback.name,
        roleTitle: parsed.roleTitle || fallback.roleTitle,
        subject: topic,
        shortTag: (parsed.shortTag || topic).slice(0, 16),
        description: parsed.description || fallback.description,
        systemPersona: parsed.systemPersona || fallback.systemPersona,
        starterPrompts:
          Array.isArray(parsed.starterPrompts) && parsed.starterPrompts.length > 0
            ? parsed.starterPrompts.slice(0, 4)
            : fallback.starterPrompts,
        customChannels:
          Array.isArray(parsed.customChannels) && parsed.customChannels.length >= 4
            ? parsed.customChannels.slice(0, 4)
            : fallback.customChannels,
        avatarParts: parts,
        rivFile: matchedRig.rivFile,
        matchedRigLabel: matchedRig.label,
        accentColor: palette.accent,
        secondaryColor: palette.secondary,
        discBackground: palette.gradient,
        defaultScene3d: {
          ...fallback.defaultScene3d,
          title: `${topic} — 3D Concept Architecture`,
          nodes,
        },
        source: 'gemini-combinatorial-builder',
      });
    } catch {
      return NextResponse.json({
        ...fallback,
        source: 'instant-combinatorial-fallback',
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to generate custom mentor', details: String(err) },
      { status: 500 }
    );
  }
}
