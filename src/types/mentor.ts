export type RiveAvatarState = 'idle' | 'happy' | 'sad' | 'thinking' | 'talking';

export type StudentLevel = 'unassessed' | 'beginner' | 'intermediate' | 'advanced';

export type LearningMaterialType =
  | '3d_preview'
  | 'mini_game'
  | 'small_test'
  | 'image_explanation';

export type MentorRequestMode =
  | 'chat'
  | 'auto_recommend'
  | 'generate_3d'
  | 'generate_mini_game'
  | 'generate_small_test'
  | 'generate_image_explanation'
  | 'generate_quiz';

export interface LearningMaterialProposal {
  id: string;
  type: LearningMaterialType;
  title: string;
  targetLevel: StudentLevel;
  pedagogicalReason: string;
  summary: string;
  controlsHint: string;
  candyReward: number;
  /**
   * Self-contained HTML/CSS/JS mini-preview widget created by the mentor agent
   * that renders directly inside the chat message stream (and can be expanded).
   */
  interactiveHtmlCode: string;
}

export interface Scene3DNode {
  id: string;
  label?: string;
  shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  color: string;
  emissive?: string;
  metalness?: number;
  roughness?: number;
  wireframe?: boolean;
  opacity?: number;
  animation?: 'rotate' | 'pulse' | 'float' | 'orbit' | 'none';
  animationSpeed?: number;
  tooltip?: string;
}

export interface Scene3DConnection {
  fromId: string;
  toId: string;
  color?: string;
  label?: string;
  animatedPacket?: boolean;
}

export interface Scene3DSpec {
  title: string;
  conceptSummary: string;
  mode: 'structured_nodes' | 'threejs_html';
  cameraPosition?: [number, number, number];
  backgroundColor?: string;
  nodes?: Scene3DNode[];
  connections?: Scene3DConnection[];
  threejsHtmlCode?: string;
  interactiveControlsHint?: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  candyReward: number;
}

export interface MentorAgentTurnResponse {
  replyText: string;
  avatarState: RiveAvatarState;
  assessedLevel: StudentLevel;
  levelReason?: string;
  learningStepTitle?: string;
  keyTakeaways?: string[];
  recommendedMaterialType?: LearningMaterialType;
  learningMaterial?: LearningMaterialProposal | null;
  scene3d?: Scene3DSpec | null;
  quiz?: QuizQuestion | null;
  candyDelta: number;
  suggestedFollowUps: string[];
  modelUsed?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'mentor';
  text: string;
  timestamp: string;
  avatarState?: RiveAvatarState;
  assessedLevel?: StudentLevel;
  recommendedMaterialType?: LearningMaterialType;
  learningMaterial?: LearningMaterialProposal | null;
  scene3d?: Scene3DSpec | null;
  quiz?: QuizQuestion | null;
  candyDelta?: number;
  candyEarned?: number;
  suggestedFollowUps?: string[];
  proactiveBadge?: string;
  modelUsed?: string;
}

export interface MentorConfig {
  id: string;
  name: string;
  roleTitle: string;
  subject: string;
  shortTag: string;
  description: string;
  accentColor: string;
  secondaryColor: string;
  rivFile: string;
  stateMachineName?: string;
  ring: 0 | 1; // 0 = center of Apple Watch honeycomb, 1 = surrounding ring
  systemPersona: string;
  starterPrompts: string[];
  defaultScene3d: Scene3DSpec;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'avatar_skin' | 'streak_item' | 'studio_theme' | 'aura_effect';
  costCandy: number;
  icon: string;
  badgeColor: string;
  previewCssClass?: string;
}

export interface UserProfileState {
  userId: string;
  displayName: string;
  candyBalance: number;
  streakDays: number;
  streakFreezeCount: number;
  xpTotal: number;
  unlockedItemIds: string[];
  equippedSkinId: string | null;
  equippedThemeId: string | null;
  equippedAuraId: string | null;
  mentorLevels: Record<string, StudentLevel>;
  completedQuizIds: string[];
}
