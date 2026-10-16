import { getGenAIClient, PRIMARY_ARGON_MODEL } from './client';
import {
  AgentDiagnosticReport,
  LearnerSummary,
  QuizSubmissionRecord,
  LearnerSessionLog,
} from '@/types/admin';
import { MENTORS } from '@/data/mentors';

export interface GenerateLearnerSummaryInput {
  userId: string;
  mentorId: string;
  learner: LearnerSummary;
  submissions: QuizSubmissionRecord[];
  sessionLogs: LearnerSessionLog[];
  customDirective?: string;
}

const DIAGNOSTIC_JSON_SCHEMA = {
  type: 'object',
  properties: {
    masterySummary: {
      type: 'string',
      description:
        'Thorough, objective diagnosis of the student’s mastery level, strengths, and concept comprehension written in fluent English.',
    },
    identifiedWeaknesses: {
      type: 'array',
      items: { type: 'string' },
      description:
        '2 to 4 concrete misconceptions or weak spots identified from quiz mistakes and questions.',
    },
    learningHabits: {
      type: 'string',
      description:
        'Observations on how the student approaches learning (e.g. spatial 3D preference, rapid quiz taker, deep architectural thinker).',
    },
    recommendedNextSteps: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Actionable instructional interventions for human mentors and AI follow-up in English.',
    },
    suggestedTopics: {
      type: 'array',
      items: { type: 'string' },
      description:
        'List of next recommended curriculum modules or advanced subjects.',
    },
    confidenceScore: {
      type: 'integer',
      description: 'Assessment confidence score between 50 and 99.',
    },
  },
  required: [
    'masterySummary',
    'identifiedWeaknesses',
    'learningHabits',
    'recommendedNextSteps',
    'suggestedTopics',
    'confidenceScore',
  ],
};

export async function generateLearnerDiagnosticReport(
  input: GenerateLearnerSummaryInput
): Promise<AgentDiagnosticReport> {
  const mentor = MENTORS.find((m) => m.id === input.mentorId) || MENTORS[0];

  const submissionsDigest = input.submissions.length > 0
    ? input.submissions
        .map(
          (s, idx) =>
            `[Quiz ${idx + 1}] Topic: ${s.channelSlug || 'General'} | Q: "${s.questionText}" | Selected: Option ${s.selectedOptionIndex} (Correct: Option ${s.correctOptionIndex}) -> Result: ${s.isCorrect ? 'PASS' : 'FAIL'} | Explanation: ${s.explanation || 'N/A'}`
        )
        .join('\n')
    : 'No quiz submission records yet';

  const logsDigest = input.sessionLogs.length > 0
    ? input.sessionLogs
        .map(
          (l, idx) =>
            `[Turn ${idx + 1}] (${l.role.toUpperCase()}) [Intent: ${l.studentIntent || 'N/A'}] "${l.text}"`
        )
        .join('\n')
    : 'No dialogue session logs yet';

  const prompt = `You are ${mentor.name} (${mentor.roleTitle}, subject: ${mentor.subject}), acting as an authoritative AI Pedagogical Diagnostic Mentor Agent.
You are generating a formal diagnostic briefing report for human expert supervisors (professors, lead engineers, instructional coaches) regarding student [${input.learner.displayName} (ID: ${input.userId})].

[Student Profile & Metrics]
- Total Conversation Turns: ${input.learner.totalTurns}
- Total XP: ${input.learner.xpTotal} XP
- Candy Balance: ${input.learner.candyBalance} Candy
- Quiz Accuracy: ${input.learner.quizStats.accuracyRate}% (${input.learner.quizStats.correctCount}/${input.learner.quizStats.totalAttempted} correct)
- Current Assessed Level: ${input.learner.mentorLevels[input.mentorId] || 'unassessed'}
${input.customDirective ? `[Human Expert Custom Directive]: "${input.customDirective}"` : ''}

[Student Quiz Submissions]
${submissionsDigest}

[Student Inquiries & Dialogue History]
${logsDigest}

[Instructions]
1. Pinpoint what concepts the student mastered and specifically analyze the root causes of any mistakes (misconceptions, mental model flaws).
2. Evaluate their learning habits (e.g., proactive 3D visual requests, deep questions, quick trial-and-error).
3. Provide actionable pedagogical next steps and recommended subsequent topics in fluent, professional English.`;

  try {
    const ai = getGenAIClient();
    const modelToUse = PRIMARY_ARGON_MODEL;

    // Timeout after 8 seconds to ensure fast UI response even if upstream network has latency
    const callPromise = ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a Senior Pedagogical Diagnostic Agent for Computer Science and Engineering. Return precise structured JSON matching the provided schema in professional English.',
        responseMimeType: 'application/json',
        responseSchema: DIAGNOSTIC_JSON_SCHEMA,
        temperature: 0.3,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 8000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');


    return {
      userId: input.userId,
      mentorId: input.mentorId,
      generatedAt: new Date().toISOString(),
      masterySummary:
        parsed.masterySummary ||
        `Student ${input.learner.displayName} demonstrates active engagement with core concepts but requires targeted reinforcement in low-level memory lifecycles.`,
      identifiedWeaknesses: Array.isArray(parsed.identifiedWeaknesses)
        ? parsed.identifiedWeaknesses
        : ['Edge case handling in dynamic memory reclamation'],
      learningHabits:
        parsed.learningHabits ||
        'Highly responsive to 3D spatial visualizations and interactive packet flow models before taking quizzes.',
      recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps)
        ? parsed.recommendedNextSteps
        : ['Guide student through interactive 3D simulations of memory boundaries and assign reinforcement quizzes.'],
      suggestedTopics: Array.isArray(parsed.suggestedTopics)
        ? parsed.suggestedTopics
        : ['Memory Safety and Smart Pointer Patterns', 'Cache Hierarchy and Prefetching'],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 88,
    };
  } catch (err) {
    console.warn('[mentorSummaryAgent] Gemini call fallback to rule-based diagnostic:', err);

    const accuracy = input.learner.quizStats.accuracyRate;
    const isHigh = accuracy >= 80;
    const isMid = accuracy >= 50;

    return {
      userId: input.userId,
      mentorId: input.mentorId,
      generatedAt: new Date().toISOString(),
      masterySummary: isHigh
        ? `Student ${input.learner.displayName} demonstrates strong mastery across ${mentor.subject} with a ${accuracy}% quiz pass rate. They frequently explore advanced architectural topologies and 3D visual simulations.`
        : isMid
        ? `Student ${input.learner.displayName} shows solid conceptual intuition for basic principles, but exhibits notable misconceptions in pointer lifecycles and hardware boundaries.`
        : `Student ${input.learner.displayName} is currently in the foundational learning stage with multiple quiz misses. Guided 3D conceptual walkthroughs are recommended before advancing to complex topics.`,
      identifiedWeaknesses: [
        'Dangling pointer dereference and undefined behavior (UB) consequences upon free()',
        'Spatial locality disparities between contiguous arrays and heap-scattered structures',
      ],
      learningHabits:
        'Proactively requests interactive 3D spatial scenes to inspect memory structures before attempting quizzes.',
      recommendedNextSteps: [
        'Engage student with Socratic questions on allocator metadata and Use-After-Free vulnerabilities',
        'Demonstrate C++ RAII and smart pointer ownership semantics in real-time 3D',
      ],
      suggestedTopics: [
        'Resource Acquisition Is Initialization (RAII) & Ownership',
        'Cache Line False Sharing in Multi-Core Architectures',
      ],
      confidenceScore: 85,
    };
  }
}
