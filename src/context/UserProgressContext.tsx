'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  MentorConfig,
  ShopItem,
  StudentLevel,
  UserProfileState,
} from '@/types/mentor';

const LOCAL_STORAGE_KEY = 'mentors_user_profile_v1';
const ANON_SESSION_STORAGE_KEY = 'mentors_anon_session_v1';
export const BROWSER_CUSTOM_MENTORS_STORAGE_KEY =
  'mentors_browser_custom_mentors_v1';

function createAnonymousIdentity(): { userId: string; displayName: string } {
  const randomHex =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 10);
  const tagNum = Math.floor(1000 + Math.random() * 9000);
  return {
    userId: `anon_${randomHex}`,
    displayName: `Guest #${tagNum}`,
  };
}

export const INITIAL_USER_PROFILE: UserProfileState = {
  userId: 'anon_browser_guest',
  displayName: 'Guest Explorer',
  candyBalance: 50,
  streakDays: 5,
  streakFreezeCount: 1,
  xpTotal: 320,
  unlockedItemIds: ['skin-neon-cyber'],
  equippedSkinId: 'skin-neon-cyber',
  equippedThemeId: null,
  equippedAuraId: null,
  mentorLevels: {
    'cs-professor': 'intermediate',
  },
  completedQuizIds: [],
};

export interface CandyToastItem {
  id: string;
  amount: number;
  reason: string;
}

export interface UserProgressContextValue {
  profile: UserProfileState;
  isAnonymous: boolean;
  storageMode: 'firestore' | 'memory-fallback' | 'syncing';
  addCandy: (amount: number, reason?: string) => void;
  purchaseItem: (item: ShopItem) => { success: boolean; message: string };
  equipItem: (item: ShopItem) => void;
  updateMentorLevel: (mentorId: string, level: StudentLevel) => void;
  markQuizCompleted: (quizId: string, candyReward: number) => void;
  updateDisplayName: (name: string) => void;
  resetAnonymousSession: () => void;
  customRivFiles: Record<string, string>;
  setCustomRivFile: (mentorIdOrGlobal: string, blobUrl: string) => void;
  customMentors: MentorConfig[];
  saveCustomMentor: (mentor: MentorConfig) => void;
  deleteCustomMentor: (mentorId: string) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
}

const UserProgressContext = createContext<UserProgressContextValue | undefined>(
  undefined
);

export function UserProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfileState>(INITIAL_USER_PROFILE);
  const [storageMode, setStorageMode] = useState<
    'firestore' | 'memory-fallback' | 'syncing'
  >('syncing');
  const [customRivFiles, setCustomRivFiles] = useState<Record<string, string>>(
    {}
  );
  const [customMentors, setCustomMentors] = useState<MentorConfig[]>([]);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<CandyToastItem[]>([]);
  const hydratedRef = useRef(false);

  const syncToBackend = useCallback(async (nextProfile: UserProfileState) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(nextProfile)
        );
      }
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: nextProfile }),
      });
      if (res.ok) {
        const data = await res.json();
        if (
          data?.storage === 'firestore' ||
          data?.storage === 'memory-fallback'
        ) {
          setStorageMode(data.storage);
        }
      }
    } catch {
      setStorageMode('memory-fallback');
    }
  }, []);

  // Browser-based Anonymous Login & Initial Hydration from localStorage + /api/progress
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let anonIdentity = {
      userId: INITIAL_USER_PROFILE.userId,
      displayName: INITIAL_USER_PROFILE.displayName,
    };

    try {
      const savedAnon = window.localStorage.getItem(ANON_SESSION_STORAGE_KEY);
      if (savedAnon) {
        const parsedAnon = JSON.parse(savedAnon);
        if (parsedAnon?.userId) {
          anonIdentity = {
            userId: String(parsedAnon.userId),
            displayName: String(parsedAnon.displayName || 'Guest Explorer'),
          };
        }
      } else {
        anonIdentity = createAnonymousIdentity();
        window.localStorage.setItem(
          ANON_SESSION_STORAGE_KEY,
          JSON.stringify(anonIdentity)
        );
      }
    } catch {
      anonIdentity = createAnonymousIdentity();
    }

    let localLoaded: UserProfileState | null = null;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.candyBalance === 'number') {
          const merged: UserProfileState = {
            ...INITIAL_USER_PROFILE,
            ...parsed,
            userId: parsed.userId?.startsWith('anon_')
              ? parsed.userId
              : anonIdentity.userId,
            displayName: parsed.displayName || anonIdentity.displayName,
          };
          localLoaded = merged;
          setProfile(merged);
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }

    if (!localLoaded) {
      const seededAnonProfile: UserProfileState = {
        ...INITIAL_USER_PROFILE,
        userId: anonIdentity.userId,
        displayName: anonIdentity.displayName,
      };
      localLoaded = seededAnonProfile;
      setProfile(seededAnonProfile);
    }

    // Load browser-only custom mentors from localStorage (never synced to server)
    try {
      const rawCustom = window.localStorage.getItem(
        BROWSER_CUSTOM_MENTORS_STORAGE_KEY
      );
      if (rawCustom) {
        const parsedCustom = JSON.parse(rawCustom);
        if (Array.isArray(parsedCustom)) {
          setCustomMentors(parsedCustom);
        }
      }
    } catch {
      // Ignore parse errors
    }

    const activeUserId = localLoaded.userId;

    (async () => {
      try {
        const res = await fetch(
          `/api/progress?userId=${encodeURIComponent(activeUserId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (
            data?.storage === 'firestore' ||
            data?.storage === 'memory-fallback'
          ) {
            setStorageMode(data.storage);
          }
          if (localLoaded) {
            void syncToBackend(localLoaded);
          }
        }
      } catch {
        setStorageMode('memory-fallback');
      }
    })();
  }, [syncToBackend]);

  const triggerCandyToast = useCallback((amount: number, reason?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: CandyToastItem = {
      id,
      amount,
      reason: reason || 'Learning reward earned!',
    };
    setToasts((prev) => [...prev.slice(-3), toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const addCandy = useCallback(
    (amount: number, reason?: string) => {
      if (!amount || amount === 0) return;
      if (amount > 0) {
        triggerCandyToast(amount, reason || 'Candy bonus earned!');
      }
      setProfile((prev) => {
        const next: UserProfileState = {
          ...prev,
          candyBalance: Math.max(0, prev.candyBalance + amount),
          xpTotal: amount > 0 ? prev.xpTotal + amount * 10 : prev.xpTotal,
        };
        void syncToBackend(next);
        return next;
      });
    },
    [syncToBackend, triggerCandyToast]
  );

  const purchaseItem = useCallback(
    (item: ShopItem): { success: boolean; message: string } => {
      const isConsumableStreak = item.id === 'streak-freeze';
      const alreadyUnlocked =
        !isConsumableStreak && profile.unlockedItemIds.includes(item.id);

      if (alreadyUnlocked) {
        return {
          success: false,
          message: 'You already own this item. Click Equip to activate it!',
        };
      }

      if (profile.candyBalance < item.costCandy) {
        return {
          success: false,
          message: `Not enough Candy! Need ${item.costCandy - profile.candyBalance} 🍬 more.`,
        };
      }

      const nextUnlocked = profile.unlockedItemIds.includes(item.id)
        ? profile.unlockedItemIds
        : [...profile.unlockedItemIds, item.id];

      const next: UserProfileState = {
        ...profile,
        candyBalance: profile.candyBalance - item.costCandy,
        unlockedItemIds: nextUnlocked,
        streakFreezeCount:
          item.id === 'streak-freeze'
            ? profile.streakFreezeCount + 1
            : profile.streakFreezeCount,
        equippedSkinId:
          item.category === 'avatar_skin' ? item.id : profile.equippedSkinId,
        equippedAuraId:
          item.category === 'aura_effect' ? item.id : profile.equippedAuraId,
        equippedThemeId:
          item.category === 'studio_theme' ? item.id : profile.equippedThemeId,
      };

      setProfile(next);
      void syncToBackend(next);

      return {
        success: true,
        message:
          item.id === 'streak-freeze'
            ? `🧊 Purchased Streak Freeze! (Owned: ${next.streakFreezeCount})`
            : `🎉 Unlocked & equipped "${item.name}"!`,
      };
    },
    [profile, syncToBackend]
  );

  const equipItem = useCallback(
    (item: ShopItem) => {
      setProfile((prev) => {
        if (!prev.unlockedItemIds.includes(item.id)) return prev;

        const next: UserProfileState = {
          ...prev,
          equippedSkinId:
            item.category === 'avatar_skin'
              ? prev.equippedSkinId === item.id
                ? null
                : item.id
              : prev.equippedSkinId,
          equippedAuraId:
            item.category === 'aura_effect'
              ? prev.equippedAuraId === item.id
                ? null
                : item.id
              : prev.equippedAuraId,
          equippedThemeId:
            item.category === 'studio_theme'
              ? prev.equippedThemeId === item.id
                ? null
                : item.id
              : prev.equippedThemeId,
        };
        void syncToBackend(next);
        return next;
      });
    },
    [syncToBackend]
  );

  const updateMentorLevel = useCallback(
    (mentorId: string, level: StudentLevel) => {
      if (!mentorId) return;
      setProfile((prev) => {
        if (prev.mentorLevels[mentorId] === level) return prev;
        const next: UserProfileState = {
          ...prev,
          mentorLevels: {
            ...prev.mentorLevels,
            [mentorId]: level,
          },
        };
        void syncToBackend(next);
        return next;
      });
    },
    [syncToBackend]
  );

  const markQuizCompleted = useCallback(
    (quizId: string, candyReward: number) => {
      setProfile((prev) => {
        const alreadyDone = prev.completedQuizIds.includes(quizId);
        const hasDoubleBoost = prev.unlockedItemIds.includes(
          'double-candy-boost'
        );
        const baseReward = Math.max(1, candyReward || 10);
        const finalReward = hasDoubleBoost ? baseReward * 2 : baseReward;

        triggerCandyToast(
          finalReward,
          hasDoubleBoost
            ? '⚡ 2x Booster Active! Quiz Mastery Reward!'
            : alreadyDone
              ? 'Review Quiz Completed Bonus!'
              : 'Quiz Mastered Perfectly!'
        );

        const next: UserProfileState = {
          ...prev,
          candyBalance: prev.candyBalance + finalReward,
          xpTotal: prev.xpTotal + finalReward * 15,
          completedQuizIds: alreadyDone
            ? prev.completedQuizIds
            : [...prev.completedQuizIds, quizId],
        };
        void syncToBackend(next);
        return next;
      });
    },
    [syncToBackend, triggerCandyToast]
  );

  const updateDisplayName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setProfile((prev) => {
        const next: UserProfileState = {
          ...prev,
          displayName: trimmed,
        };
        try {
          window.localStorage.setItem(
            ANON_SESSION_STORAGE_KEY,
            JSON.stringify({ userId: next.userId, displayName: next.displayName })
          );
        } catch {
          // ignore
        }
        void syncToBackend(next);
        return next;
      });
    },
    [syncToBackend]
  );

  const resetAnonymousSession = useCallback(() => {
    const fresh = createAnonymousIdentity();
    const next: UserProfileState = {
      ...INITIAL_USER_PROFILE,
      userId: fresh.userId,
      displayName: fresh.displayName,
    };
    try {
      window.localStorage.setItem(ANON_SESSION_STORAGE_KEY, JSON.stringify(fresh));
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setProfile(next);
    void syncToBackend(next);
  }, [syncToBackend]);

  const setCustomRivFile = useCallback(
    (mentorIdOrGlobal: string, blobUrl: string) => {
      setCustomRivFiles((prev) => {
        if (!blobUrl) {
          const copy = { ...prev };
          delete copy[mentorIdOrGlobal];
          return copy;
        }
        return {
          ...prev,
          [mentorIdOrGlobal]: blobUrl,
        };
      });
    },
    []
  );

  const saveCustomMentor = useCallback((mentor: MentorConfig) => {
    setCustomMentors((prev) => {
      const next = [
        { ...mentor, isCustom: true, createdAt: mentor.createdAt || new Date().toISOString() },
        ...prev.filter((m) => m.id !== mentor.id),
      ];
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            BROWSER_CUSTOM_MENTORS_STORAGE_KEY,
            JSON.stringify(next)
          );
        }
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const deleteCustomMentor = useCallback((mentorId: string) => {
    setCustomMentors((prev) => {
      const next = prev.filter((m) => m.id !== mentorId);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            BROWSER_CUSTOM_MENTORS_STORAGE_KEY,
            JSON.stringify(next)
          );
        }
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const value = useMemo<UserProgressContextValue>(
    () => ({
      profile,
      isAnonymous: true,
      storageMode,
      addCandy,
      purchaseItem,
      equipItem,
      updateMentorLevel,
      markQuizCompleted,
      updateDisplayName,
      resetAnonymousSession,
      customRivFiles,
      setCustomRivFile,
      customMentors,
      saveCustomMentor,
      deleteCustomMentor,
      isShopOpen,
      setIsShopOpen,
    }),
    [
      profile,
      storageMode,
      addCandy,
      purchaseItem,
      equipItem,
      updateMentorLevel,
      markQuizCompleted,
      updateDisplayName,
      resetAnonymousSession,
      customRivFiles,
      setCustomRivFile,
      customMentors,
      saveCustomMentor,
      deleteCustomMentor,
      isShopOpen,
      setIsShopOpen,
    ]
  );

  return (
    <UserProgressContext.Provider value={value}>
      {children}

      {/* Floating +Candy Celebration Toasts */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-20 right-6 z-[90] flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-pink-400/50 shadow-[0_0_25px_rgba(244,114,182,0.45)] backdrop-blur-xl text-white animate-bounce"
            >
              <span className="text-2xl">🍬</span>
              <div>
                <div className="text-sm font-extrabold text-pink-300 tracking-wide">
                  +{toast.amount} Candy Earned!
                </div>
                <div className="text-xs text-slate-300">{toast.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress(): UserProgressContextValue {
  const ctx = useContext(UserProgressContext);
  if (!ctx) {
    throw new Error(
      'useUserProgress must be used within a UserProgressProvider'
    );
  }
  return ctx;
}
