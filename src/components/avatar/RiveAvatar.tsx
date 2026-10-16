'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  StateMachineInputType,
  RuntimeLoader,
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
  /** Optional stagger delay (ms) when mounting dozens of avatars at once */
  loadDelayMs?: number;
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

const CORE_RIV_FILES = [
  '/riv/jun.riv',
  '/riv/mina.riv',
  '/riv/bolt.riv',
  '/riv/ms-han.riv',
  '/riv/coach-pen.riv',
  '/riv/sora.riv',
  '/riv/nabi.riv',
  '/riv/mong.riv',
];

const AVATAR_RIVE_LAYOUT = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});

// Shared in-memory ArrayBuffer + in-flight Promise caches so each .riv file is fetched only ONCE
const rivBufferCache = new Map<string, ArrayBuffer | null>();
const rivBufferPromiseCache = new Map<string, Promise<ArrayBuffer | null>>();

export function fetchRivBuffer(url: string): Promise<ArrayBuffer | null> {
  if (!url) return Promise.resolve(null);
  if (rivBufferCache.has(url)) {
    return Promise.resolve(rivBufferCache.get(url)!);
  }
  const existing = rivBufferPromiseCache.get(url);
  if (existing) {
    return existing;
  }

  const promise = fetch(url)
    .then(async (res) => {
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || contentType.includes('text/html')) {
        rivBufferCache.set(url, null);
        return null;
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 16) {
        rivBufferCache.set(url, null);
        return null;
      }
      rivBufferCache.set(url, buf);
      return buf;
    })
    .catch(() => {
      rivBufferCache.set(url, null);
      return null;
    });

  rivBufferPromiseCache.set(url, promise);
  return promise;
}

export function preloadRivAssets(urls: string[] = CORE_RIV_FILES): void {
  if (typeof window === 'undefined') return;
  for (const url of urls) {
    void fetchRivBuffer(url);
  }
}

// Configure Rive WASM runtime to load from local /riv/rive.wasm instead of external unpkg CDN
if (typeof window !== 'undefined') {
  try {
    RuntimeLoader.setWasmUrl('/riv/rive.wasm');
    RuntimeLoader.setWasmFallbackUrl('/riv/rive_fallback.wasm');
    void RuntimeLoader.awaitInstance().catch(() => {});
    preloadRivAssets(CORE_RIV_FILES);
  } catch {
    // Ignore SSR or duplicate initialization
  }
}

interface RiveCanvasRuntimeProps {
  src: string;
  buffer?: ArrayBuffer | null;
  pixelSize: number;
  state: RiveAvatarState;
  stateMachineName?: string;
  faceCrop?: boolean;
  onLoadFailure: () => void;
}

function RiveCanvasRuntime({
  src,
  buffer,
  pixelSize,
  state,
  stateMachineName = 'Character',
  faceCrop = true,
  onLoadFailure,
}: RiveCanvasRuntimeProps) {
  const bufferCopy = useMemo(
    () => (buffer ? buffer.slice(0) : undefined),
    [buffer]
  );

  const customDpr = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const dpr = window.devicePixelRatio || 1;
    return Math.min(dpr, pixelSize <= 112 ? 1.5 : 2);
  }, [pixelSize]);

  const { rive, RiveComponent } = useRive(
    {
      ...(bufferCopy ? { buffer: bufferCopy } : { src }),
      stateMachines: stateMachineName,
      autoplay: true,
      autoBind: true,
      shouldDisableRiveListeners: true,
      layout: AVATAR_RIVE_LAYOUT,
      onLoadError: () => {
        onLoadFailure();
      },
    },
    {
      shouldUseIntersectionObserver: false,
      useDevicePixelRatio: true,
      customDevicePixelRatio: customDpr,
    }
  );

  useEffect(() => {
    if (!rive) return;

    try {
      rive.resizeToCanvas();
      rive.startRendering();
    } catch {
      // Ignore if canvas not ready yet
    }

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
  loadDelayMs = 0,
  onStateClick,
}: RiveAvatarProps) {
  useId();
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] ?? 88;
  const primaryUrl = customRivBlobUrl || rivSrc || '/riv/jun.riv';

  const [resolvedRivUrl, setResolvedRivUrl] = useState<string | null>(() =>
    primaryUrl
  );
  const [resolvedBuffer, setResolvedBuffer] = useState<ArrayBuffer | null>(
    () => rivBufferCache.get(primaryUrl) ?? null
  );
  const [isDelayReady, setIsDelayReady] = useState<boolean>(loadDelayMs <= 0);
  const [riveFailed, setRiveFailed] = useState(false);

  useEffect(() => {
    if (loadDelayMs <= 0) {
      setIsDelayReady(true);
      return;
    }
    const timer = setTimeout(() => {
      setIsDelayReady(true);
    }, loadDelayMs);
    return () => clearTimeout(timer);
  }, [loadDelayMs]);

  // Resolve and cache the .riv ArrayBuffer once per unique URL across the whole app
  useEffect(() => {
    let cancelled = false;
    setRiveFailed(false);

    async function resolveSource() {
      if (customRivBlobUrl) {
        const buf = await fetchRivBuffer(customRivBlobUrl);
        if (!cancelled) {
          setResolvedRivUrl(customRivBlobUrl);
          setResolvedBuffer(buf);
        }
        return;
      }

      const candidates = Array.from(
        new Set([rivSrc, '/riv/jun.riv', '/riv/default-mentor.riv'])
      ).filter(Boolean);

      for (const candidate of candidates) {
        const cached = rivBufferCache.get(candidate);
        if (cached) {
          if (!cancelled) {
            setResolvedRivUrl(candidate);
            setResolvedBuffer(cached);
          }
          return;
        }

        const buf = await fetchRivBuffer(candidate);
        if (cancelled) return;
        if (buf) {
          setResolvedRivUrl(candidate);
          setResolvedBuffer(buf);
          return;
        }
      }

      if (!cancelled) {
        setResolvedRivUrl(null);
        setResolvedBuffer(null);
      }
    }

    resolveSource();
    return () => {
      cancelled = true;
    };
  }, [rivSrc, customRivBlobUrl]);

  return (
    <div
      role="img"
      aria-label={`${mentorName} Rive Avatar (${state} state)`}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
      className={`relative select-none flex items-center justify-center rounded-full transition-transform duration-300 ${className}`}
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

        {isDelayReady && resolvedRivUrl && resolvedBuffer && !riveFailed ? (
          <div className="relative z-10 w-full h-full">
            <RiveCanvasRuntime
              key={resolvedRivUrl}
              src={resolvedRivUrl}
              buffer={resolvedBuffer}
              pixelSize={pixelSize}
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
