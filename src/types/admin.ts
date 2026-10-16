import { StudentLevel } from './mentor';

export interface LearnerSummary {
  userId: string;
  displayName: string;
  lastActiveAt: string;
  totalTurns: number;
  candyBalance: number;
  streakDays: number;
  xpTotal: number;
  mentorLevels: Record<string, StudentLevel>;
  quizStats: {
    totalAttempted: number;
    correctCount: number;
    accuracyRate: number; // e.g. 75 (%)
  };
}

export interface AgentDiagnosticReport {
  userId: string;
  mentorId: string;
  generatedAt: string;
  masterySummary: string;
  identifiedWeaknesses: string[];
  learningHabits: string;
  recommendedNextSteps: string[];
  suggestedTopics: string[];
  confidenceScore?: number; // 0-100
}

export interface QuizSubmissionRecord {
  id: string;
  userId: string;
  mentorId: string;
  channelSlug?: string;
  questionText: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  candyReward: number;
  submittedAt: string;
  explanation?: string;
}

export interface LearnerSessionLog {
  id: string;
  userId: string;
  mentorId: string;
  role: 'user' | 'mentor';
  text: string;
  studentIntent?: 'ask_concept' | 'propose_topic' | 'request_3d' | 'challenge_quiz' | 'general';
  scene3dTitle?: string;
  timestamp: string;
}

export interface MentorPromptConfig {
  mentorId: string;
  systemPersona: string;
  diagnosticGuidelines: string;
  studentDirectives: Record<string, string>; // userId -> custom directive
  updatedAt: string;
  updatedBy: string;
}

export interface ReferenceMaterial {
  id: string;
  mentorId: string;
  title: string;
  category: 'textbook' | 'paper' | 'architecture_guide' | 'cheat_sheet';
  content: string; // Markdown or plain text
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
