'use client';

import React, { useEffect, useId, useState } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  StateMachineInputType,
} from '@rive-app/react-canvas';
import { RiveAvatarState } from '@/types/mentor';

export interface RiveAvatarProps {
  rivSrc: string;
  state: RiveAvatarState;
  accentColor?: string;
  secondaryColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  equippedSkinId?: string | null;
  equippedAuraId?: string | null;
  mentorName?: string;
  interactive?: boolean;
  customRivBlobUrl?: string | null;
  stateMachineName?: string;
  discBackground?: string;
  className?: string;
  onStateClick?: (nextState: RiveAvatarState) => void;
}

const STATE_ORDER: RiveAvatarState[] = [
  'idle',
  'happy',
  'sad',
  'thinking',
  'talking',
];

const STATE_NUMBER_MAP: Record<RiveAvatarState, number> = {
  idle: 0,
  happy: 1,
  sad: 2,
  thinking: 3,
  talking: 4,
};

const SIZE_MAP: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 56,
  md: 88,
  lg: 132,
  xl: 184,
};

// Cache probed .riv URLs across instances so bubbles don't re-probe repeatedly
const rivProbeCache = new Map<string, boolean>();

async function checkRivExists(url: string): Promise<boolean> {
  if (!url) return false;
  if (url.startsWith('blob:') || url.startsWith('data:')) return true;
  if (rivProbeCache.has(url)) {
    return rivProbeCache.get(url)!;
  }
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const contentType = res.headers.get('content-type') || '';
    const valid = res.ok && !contentType.includes('text/html');
    rivProbeCache.set(url, valid);
    return valid;
  } catch {
    rivProbeCache.set(url, false);
    return false;
  }
}

interface RiveCanvasRuntimeProps {
  src: string;
  state: RiveAvatarState;
  stateMachineName?: string;
  faceCrop?: boolean;
  onLoadFailure: () => void;
}

function RiveCanvasRuntime({
  src,
  state,
  stateMachineName = 'Character',
  faceCrop = true,
  onLoadFailure,
}: RiveCanvasRuntimeProps) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachineName,
    autoplay: true,
    autoBind: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoadError: () => {
      onLoadFailure();
    },
  });

  useEffect(() => {
    if (!rive) return;

    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    let repeatInterval: ReturnType<typeof setInterval> | null = null;

    const applyOpenRiveState = () => {
      try {
        // 1. OpenRive Data-Bound ViewModel ('mood' & 'result' properties on 'Character' ViewModel)
        const vmi = (rive as unknown as {
          viewModelInstance?: {
            number?: (name: string) => { value: number } | null;
          };
        }).viewModelInstance;

        if (vmi && typeof vmi.number === 'function') {
          const moodProp = vmi.number('mood');
          const resultProp = vmi.number('result');

          if (moodProp) {
            if (state === 'thinking') {
              moodProp.value = 1;
            } else if (state === 'talking') {
              moodProp.value = 2;
            } else {
              moodProp.value = 0; // Idle base mood
            }
          }

          if (resultProp) {
            if (state === 'happy') {
              // Trigger 'Correct' one-shot on the Reaction layer (result == 1), then reset to 0
              resultProp.value = 1;
              resetTimer = setTimeout(() => {
                try {
                  resultProp.value = 0;
                } catch {
                  // Ignore if unmounted
                }
              }, 120);
            } else if (state === 'sad') {
              // Trigger 'Wrong' one-shot on the Reaction layer (result == 2), then reset to 0
              resultProp.value = 2;
              resetTimer = setTimeout(() => {
                try {
                  resultProp.value = 0;
                } catch {
                  // Ignore if unmounted
                }
              }, 120);
            } else {
              resultProp.value = 0;
            }
          }
        }

        // 2. Fallback: Classic Rive State Machine inputs (for arbitrary user-uploaded .riv files)
        const candidateMachines = Array.from(
          new Set([
            stateMachineName,
            'Character',
            'State Machine 1',
            'AvatarStateMachine',
            ...(rive.stateMachineNames || []),
          ])
        );

        for (const machine of candidateMachines) {
          const inputs = rive.stateMachineInputs(machine);
          if (!inputs || inputs.length === 0) continue;

          for (const input of inputs) {
            const lowerName = input.name.toLowerCase().trim();

            if (
              (lowerName === 'state' ||
                lowerName === 'emotion' ||
                lowerName === 'mode' ||
                lowerName === 'avatarstate') &&
              input.type === StateMachineInputType.Number
            ) {
              input.value = STATE_NUMBER_MAP[state];
            }

            if (STATE_ORDER.includes(lowerName as RiveAvatarState)) {
              if (input.type === StateMachineInputType.Boolean) {
                input.value = lowerName === state;
              } else if (
                input.type === StateMachineInputType.Trigger &&
                lowerName === state
              ) {
                input.fire();
              }
            }
          }
        }
      } catch {
        // Safely ignore state transition mismatches
      }
    };

    applyOpenRiveState();

    // If held in 'happy' or 'sad' state (e.g., studio state preview), re-fire the one-shot reaction periodically
    if (state === 'happy' || state === 'sad') {
      repeatInterval = setInterval(() => {
        applyOpenRiveState();
      }, 2100);
    }

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      if (repeatInterval) clearInterval(repeatInterval);
    };
  }, [rive, state, stateMachineName]);

  return (
    <div
      className="w-full h-full flex items-center justify-center pointer-events-none"
      style={
        faceCrop
          ? {
              transform: 'translateY(17%) scale(1.92)',
              transformOrigin: 'center center',
            }
          : undefined
      }
    >
      <RiveComponent className="w-full h-full" />
    </div>
  );
}

export function RiveAvatar({
  rivSrc,
  state,
  accentColor = '#38bdf8',
  secondaryColor = '#6366f1',
  size = 'md',
  equippedSkinId = null,
  equippedAuraId = null,
  mentorName = 'AI Mentor',
  interactive = false,
  customRivBlobUrl = null,
  stateMachineName = 'Character',
  discBackground,
  className = '',
  onStateClick,
}: RiveAvatarProps) {
  const uniqueId = useId().replace(/:/g, '');
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] ?? 88;

  const [resolvedRivUrl, setResolvedRivUrl] = useState<string | null>(
    customRivBlobUrl || rivSrc || '/riv/jun.riv'
  );
  const [riveFailed, setRiveFailed] = useState(false);

  // Probe candidate .riv files in priority order
  useEffect(() => {
    let cancelled = false;
    setRiveFailed(false);
    setResolvedRivUrl(customRivBlobUrl || rivSrc || '/riv/jun.riv');

    async function resolveSource() {
      if (customRivBlobUrl) {
        if (!cancelled) setResolvedRivUrl(customRivBlobUrl);
        return;
      }

      const candidates = Array.from(
        new Set([rivSrc, '/riv/jun.riv', '/riv/default-mentor.riv'])
      ).filter(Boolean);

      for (const candidate of candidates) {
        const exists = await checkRivExists(candidate);
        if (cancelled) return;
        if (exists) {
          setResolvedRivUrl(candidate);
          return;
        }
      }

      if (!cancelled) {
        setResolvedRivUrl(null);
      }
    }

    resolveSource();
    return () => {
      cancelled = true;
    };
  }, [rivSrc, customRivBlobUrl]);

  const handleAvatarClick = () => {
    if (!interactive && !onStateClick) return;
    const currentIndex = STATE_ORDER.indexOf(state);
    const nextState = STATE_ORDER[(currentIndex + 1) % STATE_ORDER.length];
    onStateClick?.(nextState);
  };

  return (
    <div
      onClick={interactive || onStateClick ? handleAvatarClick : undefined}
      role={interactive || onStateClick ? 'button' : 'img'}
      aria-label={`${mentorName} Rive Avatar (${state} state)`}
      tabIndex={interactive || onStateClick ? 0 : undefined}
      onKeyDown={
        interactive || onStateClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAvatarClick();
              }
            }
          : undefined
      }
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
      className={`relative select-none flex items-center justify-center rounded-full transition-transform duration-300 ${
        interactive || onStateClick ? 'cursor-pointer active:scale-95' : ''
      } ${className}`}
    >
      {/* Equipped Aura Effect Layer */}
      {equippedAuraId && (
        <div
          className="pointer-events-none absolute -inset-1.5 rounded-full opacity-75 blur-md animate-pulse"
          style={{
            background:
              equippedAuraId === 'aura-candy-nebula'
                ? 'conic-gradient(from 0deg, #f472b6, #a855f7, #38bdf8, #34d399, #f472b6)'
                : equippedAuraId === 'aura-quantum-halo'
                ? 'radial-gradient(circle, rgba(56,189,248,0.6) 0%, rgba(99,102,241,0.3) 60%, transparent 100%)'
                : `radial-gradient(circle, ${accentColor}66 0%, ${secondaryColor}33 65%, transparent 100%)`,
          }}
        />
      )}

      {/* Clean Studio Circular Canvas Surface so OpenRive vector characters pop crisply */}
      <div
        className="relative z-10 w-full h-full rounded-full overflow-hidden flex items-center justify-center transition-all duration-300"
        style={{
          background:
            discBackground ||
            `radial-gradient(circle at 50% 35%, #ffffff 0%, #f8fafc 68%, #e2e8f0 100%)`,
          boxShadow:
            state === 'happy'
              ? `0 0 0 2.5px #34d399, 0 8px 24px rgba(52, 211, 153, 0.28)`
              : state === 'thinking'
              ? `0 0 0 2.5px #fbbf24, 0 8px 24px rgba(251, 191, 36, 0.25)`
              : state === 'talking'
              ? `0 0 0 2.5px ${accentColor}, 0 8px 26px ${accentColor}44`
              : state === 'sad'
              ? `0 0 0 2.5px #60a5fa, 0 8px 22px rgba(96, 165, 250, 0.24)`
              : equippedSkinId === 'skin-golden-prof'
              ? `0 0 0 2.5px #fbbf24, 0 6px 20px rgba(251, 191, 36, 0.22)`
              : discBackground
              ? `0 6px 20px rgba(0, 0, 0, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.35)`
              : `0 0 0 2px ${accentColor}66, 0 6px 20px rgba(2, 6, 23, 0.45)`,
        }}
      >
        {/* Subtle top accent tint inside the studio circle */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${accentColor} 0%, transparent 65%)`,
          }}
        />

        {resolvedRivUrl && !riveFailed ? (
          <div className="relative z-10 w-full h-full">
            <RiveCanvasRuntime
              key={resolvedRivUrl}
              src={resolvedRivUrl}
              state={state}
              stateMachineName={stateMachineName}
              onLoadFailure={() => setRiveFailed(true)}
            />
          </div>
        ) : (
          <svg
            viewBox="0 0 120 120"
            className="relative z-10 w-4/5 h-4/5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="60" cy="46" r="22" fill={accentColor} opacity="0.85" />
            <path
              d="M28 102 C30 76, 90 76, 92 102 Z"
              fill={secondaryColor}
              opacity="0.85"
            />
            <circle cx="52" cy="44" r="3.5" fill="#0f172a" />
            <circle cx="68" cy="44" r="3.5" fill="#0f172a" />
            <path
              d={
                state === 'sad'
                  ? 'M52 56 Q60 50 68 56'
                  : 'M51 53 Q60 60 69 53'
              }
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export default RiveAvatar;
