'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { QuizQuestion } from '@/types/mentor';

export interface QuizDrawerProps {
  quiz: QuizQuestion | null;
  onAnswerSubmit: (isCorrect: boolean, candyEarned: number, selectedIndex: number) => void;
  onRequestNewQuiz: () => void;
  isLoadingQuiz?: boolean;
  accentColor?: string;
}

const DIFFICULTY_META: Record<
  QuizQuestion['difficulty'],
  { label: string; badgeClass: string }
> = {
  beginner: {
    label: 'Beginner',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
  intermediate: {
    label: 'Intermediate',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
  },
  advanced: {
    label: 'Advanced',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  },
};

export function QuizDrawer({
  quiz,
  onAnswerSubmit,
  onRequestNewQuiz,
  isLoadingQuiz = false,
  accentColor = '#38bdf8',
}: QuizDrawerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [wrongAttempts, setWrongAttempts] = useState<number[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [rewardClaimedForId, setRewardClaimedForId] = useState<string | null>(null);

  // Reset state whenever a new quiz question arrives
  useEffect(() => {
    setSelectedIndex(null);
    setStatus('idle');
    setWrongAttempts([]);
  }, [quiz?.id, quiz?.question]);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.7 },
        colors: [accentColor, '#fbbf24', '#34d399', '#a855f7'],
      });
    } catch {
      // Fallback if canvas-confetti fails in headless environment
    }
  }, [accentColor]);

  const handleOptionSelect = useCallback(
    (index: number) => {
      if (!quiz || status === 'correct' || isLoadingQuiz) return;

      setSelectedIndex(index);
      const isCorrect = index === quiz.correctIndex;

      if (isCorrect) {
        setStatus('correct');
        triggerConfetti();
        const reward = rewardClaimedForId === quiz.id ? 0 : quiz.candyReward || 25;
        setRewardClaimedForId(quiz.id);
        onAnswerSubmit(true, reward, index);
      } else {
        setStatus('incorrect');
        setShakeKey((k) => k + 1);
        setWrongAttempts((prev) => (prev.includes(index) ? prev : [...prev, index]));
        onAnswerSubmit(false, 0, index);
      }
    },
    [quiz, status, isLoadingQuiz, rewardClaimedForId, triggerConfetti, onAnswerSubmit]
  );

  // Keyboard shortcuts 1, 2, 3, 4 when not typing inside an input/textarea
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!quiz || status === 'correct' || isLoadingQuiz) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < quiz.options.length) {
          e.preventDefault();
          handleOptionSelect(idx);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quiz, status, isLoadingQuiz, handleOptionSelect]);

  const handleRetry = () => {
    setSelectedIndex(null);
    setStatus('idle');
  };

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center backdrop-blur-xl h-full min-h-[260px]">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 mb-3"
          style={{ boxShadow: `0 0 24px ${accentColor}25` }}
        >
          <HelpCircle className="h-6 w-6 text-cyan-300" />
        </div>
        <h4 className="text-sm font-bold text-white">Autonomous Mentor Quiz Ready</h4>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
          Chat with your mentor or click below to generate an adaptive concept quiz tailored to your level and earn 🍬 Candy rewards!
        </p>
        <button
          type="button"
          onClick={onRequestNewQuiz}
          disabled={isLoadingQuiz}
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:brightness-110 disabled:opacity-50 shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          {isLoadingQuiz ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Generating Quiz...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Adaptive Quiz (+25 🍬)</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const diffMeta = DIFFICULTY_META[quiz.difficulty] || DIFFICULTY_META.intermediate;
  const candyReward = quiz.candyReward || 25;

  return (
    <div
      key={shakeKey}
      className={`flex flex-col justify-between rounded-2xl border bg-slate-900/85 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 h-full ${
        status === 'correct'
          ? 'border-emerald-400/50 shadow-emerald-500/10'
          : status === 'incorrect'
          ? 'border-rose-400/50 animate-[shake_0.4s_ease-in-out]'
          : 'border-white/10'
      }`}
    >
      {/* Shake keyframes injection */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div>
        {/* Top Header: Difficulty, Topic Tag, and Candy Reward Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${diffMeta.badgeClass}`}
            >
              <Zap className="h-3 w-3" />
              <span>{diffMeta.label}</span>
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
              #{quiz.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-200 shadow-sm">
              <span>+{candyReward} 🍬 Candy</span>
            </span>

            <button
              type="button"
              onClick={onRequestNewQuiz}
              disabled={isLoadingQuiz}
              title="Request a new quiz question"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingQuiz ? 'animate-spin' : ''}`} />
              <span>New Quiz</span>
            </button>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="mt-3.5">
          <div className="flex items-start gap-2">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-extrabold text-slate-950"
              style={{ backgroundColor: accentColor }}
            >
              Q
            </span>
            <h4 className="text-sm font-bold leading-snug text-white">{quiz.question}</h4>
          </div>
        </div>

        {/* 4 Multiple Choice Options with Keyboard Shortcut Badges */}
        <div className="mt-3.5 space-y-2">
          {quiz.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrectOption = idx === quiz.correctIndex;
            const wasTriedWrong = wrongAttempts.includes(idx);

            let optionStyle =
              'border-white/10 bg-slate-950/70 text-slate-200 hover:border-white/30 hover:bg-slate-900';

            if (status === 'correct' && isCorrectOption) {
              optionStyle =
                'border-emerald-400 bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/50';
            } else if (status === 'incorrect' && isSelected) {
              optionStyle =
                'border-rose-400 bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/50';
            } else if (wasTriedWrong) {
              optionStyle =
                'border-rose-500/30 bg-rose-950/30 text-slate-400 opacity-75';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={status === 'correct' || isLoadingQuiz}
                onClick={() => handleOptionSelect(idx)}
                className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-all duration-150 ${optionStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <kbd
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-mono font-bold transition-colors ${
                      status === 'correct' && isCorrectOption
                        ? 'border-emerald-300 bg-emerald-400 text-slate-950'
                        : status === 'incorrect' && isSelected
                        ? 'border-rose-300 bg-rose-400 text-slate-950'
                        : 'border-white/15 bg-white/5 text-slate-300 group-hover:border-white/30 group-hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </kbd>
                  <span className="leading-relaxed">{option}</span>
                </div>

                {status === 'correct' && isCorrectOption && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                )}
                {((status === 'incorrect' && isSelected) || wasTriedWrong) && (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner: Celebratory Correct State or Retryable Incorrect State */}
      <div className="mt-3.5">
        {status === 'correct' && (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 p-3.5 text-emerald-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-300 shrink-0" />
                <span className="text-xs font-extrabold text-white">
                  Correct! Your mentor is thrilled and awarded +{candyReward} 🍬 Candy!
                </span>
              </div>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 border border-amber-300/30 shrink-0">
                Rive: HAPPY 🎉
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-emerald-100/90 bg-slate-950/60 rounded-lg p-2.5 border border-emerald-400/20">
              <strong className="text-emerald-300">Mentor Explanation: </strong>
              {quiz.explanation}
            </p>

            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={onRequestNewQuiz}
                disabled={isLoadingQuiz}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next Challenge Quiz</span>
              </button>
            </div>
          </div>
        )}

        {status === 'incorrect' && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 p-3.5 text-rose-100 animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-rose-300 shrink-0" />
                <span className="text-xs font-bold text-white">
                  Not quite! That is a classic tricky point. Give it another try!
                </span>
              </div>
              <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-[10px] font-bold text-rose-200 border border-rose-300/30 shrink-0">
                Rive: SAD 😢
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-rose-200/90">
              💡 <strong>Hint:</strong> Inspect the 3D node connections and animated packet flow in the Argon 3D viewport above, then select another option.
            </p>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-300/40 bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500/30 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>⌨️ Press keys 1–4 for quick answer selection.</span>
            <span>Correct answer triggers HAPPY state</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizDrawer;
