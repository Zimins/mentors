'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  CheckCircle2,
  Code2,
  Eye,
  Gamepad2,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Sparkles,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import {
  buildAdaptiveLearningMaterial,
  MATERIAL_TYPE_META,
} from '@/lib/gemini/learningMaterialTemplates';
import type {
  LearningMaterialProposal,
  LearningMaterialType,
  MentorRequestMode,
  QuizQuestion,
  Scene3DSpec,
  StudentLevel,
} from '@/types/mentor';

export interface LearningMaterialPreviewCardProps {
  material: LearningMaterialProposal;
  mentorId: string;
  mentorName: string;
  roleTitle: string;
  subject: string;
  accentColor: string;
  assessedLevel: StudentLevel;
  scene3d: Scene3DSpec;
  quiz: QuizQuestion;
  onClaimCandyReward?: (amount: number, reason: string) => void;
  onRequestRegenerateFormat?: (
    type: LearningMaterialType,
    mode: MentorRequestMode
  ) => void;
}

const FORMAT_OPTIONS: {
  type: LearningMaterialType;
  mode: MentorRequestMode;
  label: string;
  koreanLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    type: '3d_preview',
    mode: 'generate_3d',
    label: '3D Preview',
    koreanLabel: '3D 구조',
    icon: Box,
    color: '#38bdf8',
  },
  {
    type: 'mini_game',
    mode: 'generate_mini_game',
    label: 'Mini Game',
    koreanLabel: '미니 게임',
    icon: Gamepad2,
    color: '#34d399',
  },
  {
    type: 'small_test',
    mode: 'generate_small_test',
    label: 'Small Test',
    koreanLabel: '미니 테스트',
    icon: ClipboardCheck,
    color: '#fbbf24',
  },
  {
    type: 'image_explanation',
    mode: 'generate_image_explanation',
    label: 'Image Explanation',
    koreanLabel: '도식/이미지 해설',
    icon: ImageIcon,
    color: '#c084fc',
  },
];

export function LearningMaterialPreviewCard({
  material,
  mentorId,
  mentorName,
  roleTitle,
  subject,
  accentColor,
  assessedLevel,
  scene3d,
  quiz,
  onClaimCandyReward,
  onRequestRegenerateFormat,
}: LearningMaterialPreviewCardProps) {
  const [activeType, setActiveType] = useState<LearningMaterialType>(
    material.type
  );
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [rewardedTypes, setRewardedTypes] = useState<
    Record<string, boolean>
  >({});

  // Sync when incoming material prop changes
  useEffect(() => {
    setActiveType(material.type);
  }, [material.id, material.type]);

  // If the student clicks another format tab on the card, synthesize that format's live JS/HTML preview immediately
  const displayedMaterial: LearningMaterialProposal = useMemo(() => {
    if (activeType === material.type) {
      return material;
    }
    return buildAdaptiveLearningMaterial({
      mentorId,
      mentorName,
      roleTitle,
      subject,
      accentColor,
      userMessage: material.title,
      assessedLevel: material.targetLevel || assessedLevel,
      materialType: activeType,
      learningStepTitle: material.title.split('·')[0].trim(),
      scene3d,
      quiz,
    });
  }, [
    activeType,
    material,
    mentorId,
    mentorName,
    roleTitle,
    subject,
    accentColor,
    assessedLevel,
    scene3d,
    quiz,
  ]);

  // Listen for postMessage events sent from inside the teacher's sandboxed JS/HTML Mini-Preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'MENTOR_MINI_PREVIEW_REWARD') {
        const key = `${material.id}-${data.materialType || activeType}`;
        setRewardedTypes((prev) => {
          if (prev[key]) return prev;
          const candyAmount = Number(data.candy) || displayedMaterial.candyReward || 20;
          if (onClaimCandyReward) {
            onClaimCandyReward(
              candyAmount,
              `Completed ${mentorName}'s ${MATERIAL_TYPE_META[activeType].shortLabel} Mini Preview!`
            );
          }
          return { ...prev, [key]: true };
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    material.id,
    activeType,
    displayedMaterial.candyReward,
    mentorName,
    onClaimCandyReward,
  ]);

  const activeMeta = MATERIAL_TYPE_META[activeType];
  const isCurrentRewarded = Boolean(
    rewardedTypes[`${material.id}-${activeType}`]
  );
  const levelLabel =
    (displayedMaterial.targetLevel === 'unassessed'
      ? 'intermediate'
      : displayedMaterial.targetLevel
    ).toUpperCase();

  return (
    <div
      className={`mt-2.5 rounded-2xl border bg-[#070b14]/95 overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'fixed inset-4 z-50 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)]'
          : 'relative shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
      }`}
      style={{
        borderColor: `${activeMeta.badgeColor}45`,
      }}
    >
      {/* Top Header: Gemini 4 Argon Autonomous Proposal Badge + Level Calibration */}
      <div
        className="px-3.5 py-2.5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2"
        style={{
          background: `linear-gradient(90deg, ${activeMeta.badgeColor}18 0%, rgba(15,23,42,0.92) 100%)`,
        }}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
            style={{
              color: activeMeta.badgeColor,
              borderColor: `${activeMeta.badgeColor}55`,
              backgroundColor: `${activeMeta.badgeColor}1a`,
            }}
          >
            <Sparkles className="w-3 h-3" />
            <span>
              {activeType === material.type
                ? `Gemini 4 Argon Proposed · ${activeMeta.shortLabel}`
                : `Switched Preview · ${activeMeta.shortLabel}`}
            </span>
          </span>

          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/[0.07] text-slate-200 border border-white/10">
            Level: {levelLabel}
          </span>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
            {isCurrentRewarded ? (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Reward Claimed!
              </span>
            ) : (
              `+${displayedMaterial.candyReward} 🍬 Interactive`
            )}
          </span>
        </div>

        {/* Right Controls: Live Preview vs JS/HTML Source + Expand */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setViewMode((v) => (v === 'preview' ? 'code' : 'preview'))
            }
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
            title="Inspect the HTML/JS Mini-Preview code generated by the mentor"
          >
            {viewMode === 'preview' ? (
              <>
                <Code2 className="w-3 h-3 text-sky-400" />
                <span>JS/HTML</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Live Preview</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="p-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Exit Fullscreen' : 'Expand Mini Preview'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Pedagogical Reason Banner: Why the Mentor proposed this format for the student's level */}
      <div className="px-3.5 py-2 bg-slate-950/80 border-b border-white/[0.06] flex items-start justify-between gap-2">
        <p className="text-[11px] text-slate-300 leading-snug">
          <strong className="text-white">Why {mentorName} chose this:</strong>{' '}
          {displayedMaterial.pedagogicalReason}
        </p>
      </div>

      {/* 4-Format Interactive Switcher Bar (3D Preview | Mini Game | Small Test | Image Explanation) */}
      <div className="px-3 py-1.5 bg-slate-900/75 border-b border-white/[0.06] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = activeType === opt.type;
            const isRecommended = material.type === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setActiveType(opt.type);
                  setViewMode('preview');
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white/12 text-white shadow-xs'
                    : 'bg-white/[0.03] text-slate-400 border-transparent hover:bg-white/[0.07] hover:text-slate-200'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: `${opt.color}66`,
                        color: opt.color,
                      }
                    : undefined
                }
              >
                <Icon className="w-3 h-3" />
                <span>{opt.label}</span>
                {isRecommended && (
                  <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    AI Pick
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {onRequestRegenerateFormat && (
          <button
            type="button"
            onClick={() => {
              const found = FORMAT_OPTIONS.find((f) => f.type === activeType);
              if (found) {
                onRequestRegenerateFormat(found.type, found.mode);
              }
            }}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[10px] font-bold text-sky-200 transition cursor-pointer"
            title="Ask Gemini 4 Argon to synthesize a fresh turn with this format"
          >
            <RefreshCw className="w-2.5 h-2.5 text-sky-400" />
            <span>Ask {mentorName} for New {activeMeta.shortLabel}</span>
          </button>
        )}
      </div>

      {/* Main Content Area: Sandboxed Interactive HTML/JS Mini-Preview OR Source Code Inspector */}
      <div className={isExpanded ? 'flex-1 min-h-0' : 'h-[260px] sm:h-[275px]'}>
        {viewMode === 'preview' ? (
          <iframe
            key={`${displayedMaterial.id}-${activeType}`}
            title={`${mentorName} Interactive ${activeMeta.label}`}
            srcDoc={displayedMaterial.interactiveHtmlCode}
            sandbox="allow-scripts"
            className="w-full h-full border-0 bg-[#070b14]"
          />
        ) : (
          <div className="w-full h-full overflow-auto p-3.5 bg-slate-950 font-mono text-[11px] text-emerald-300 leading-relaxed">
            <div className="mb-2 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
              Generated Self-Contained HTML5 / JS Mini-Preview Source (
              {displayedMaterial.interactiveHtmlCode.length} bytes)
            </div>
            <pre className="whitespace-pre-wrap break-words">
              {displayedMaterial.interactiveHtmlCode}
            </pre>
          </div>
        )}
      </div>

      {/* Bottom Controls Hint Bar */}
      <div className="px-3.5 py-1.5 bg-slate-950/90 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10px] text-slate-400">
        <span className="truncate">{displayedMaterial.controlsHint}</span>
        <span className="shrink-0 font-mono text-slate-500">
          Gemini 4 Argon · {activeMeta.shortLabel}
        </span>
      </div>
    </div>
  );
}
