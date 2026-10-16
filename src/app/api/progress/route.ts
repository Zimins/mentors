import { NextRequest, NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';
import { UserProfileState } from '@/types/mentor';

const GCP_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCP_PROJECT_ID ||
  'h2gdm-hack26icn-2694';
const COLLECTION_NAME = 'mentors_users';
const DEFAULT_USER_ID = 'demo-scholar-01';

const DEFAULT_PROFILE: UserProfileState = {
  userId: DEFAULT_USER_ID,
  displayName: 'Hackathon Scholar',
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

// Server-side in-memory store for graceful fallback if Firestore isn't reachable
const memoryStore = new Map<string, UserProfileState>([
  [DEFAULT_USER_ID, { ...DEFAULT_PROFILE }],
]);

let firestoreClient: Firestore | null = null;
let firestoreUnavailable = false;

function getFirestoreClient(): Firestore | null {
  if (firestoreUnavailable) return null;
  if (!firestoreClient) {
    try {
      firestoreClient = new Firestore({
        projectId: GCP_PROJECT_ID,
        ignoreUndefinedProperties: true,
      });
    } catch {
      firestoreUnavailable = true;
      return null;
    }
  }
  return firestoreClient;
}

async function withTimeout<T>(promise: Promise<T>, ms = 1800): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Firestore operation timed out'));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || DEFAULT_USER_ID;

  const db = getFirestoreClient();
  if (db) {
    try {
      const docRef = db.collection(COLLECTION_NAME).doc(userId);
      const snapshot = await withTimeout(docRef.get(), 1800);
      if (snapshot.exists) {
        const data = snapshot.data() as UserProfileState;
        const merged: UserProfileState = {
          ...DEFAULT_PROFILE,
          ...data,
          userId,
        };
        memoryStore.set(userId, merged);
        return NextResponse.json({
          profile: merged,
          storage: 'firestore',
          projectId: GCP_PROJECT_ID,
        });
      } else {
        const initial = memoryStore.get(userId) || {
          ...DEFAULT_PROFILE,
          userId,
        };
        await withTimeout(docRef.set(initial, { merge: true }), 1800);
        memoryStore.set(userId, initial);
        return NextResponse.json({
          profile: initial,
          storage: 'firestore',
          projectId: GCP_PROJECT_ID,
        });
      }
    } catch {
      // Fallback to in-memory store if credentials/database are not provisioned
      firestoreUnavailable = true;
    }
  }

  const fallbackProfile = memoryStore.get(userId) || {
    ...DEFAULT_PROFILE,
    userId,
  };
  memoryStore.set(userId, fallbackProfile);

  return NextResponse.json({
    profile: fallbackProfile,
    storage: 'memory-fallback',
    projectId: GCP_PROJECT_ID,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming: Partial<UserProfileState> = body?.profile || body || {};
    const userId = incoming.userId || DEFAULT_USER_ID;

    const existing = memoryStore.get(userId) || {
      ...DEFAULT_PROFILE,
      userId,
    };

    const updatedProfile: UserProfileState = {
      ...existing,
      ...incoming,
      userId,
      unlockedItemIds: Array.isArray(incoming.unlockedItemIds)
        ? incoming.unlockedItemIds
        : existing.unlockedItemIds,
      mentorLevels:
        incoming.mentorLevels && typeof incoming.mentorLevels === 'object'
          ? { ...existing.mentorLevels, ...incoming.mentorLevels }
          : existing.mentorLevels,
      completedQuizIds: Array.isArray(incoming.completedQuizIds)
        ? incoming.completedQuizIds
        : existing.completedQuizIds,
    };

    memoryStore.set(userId, updatedProfile);

    const db = getFirestoreClient();
    if (db) {
      try {
        const docRef = db.collection(COLLECTION_NAME).doc(userId);
        await withTimeout(
          docRef.set(
            {
              ...updatedProfile,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ),
          1800
        );
        return NextResponse.json({
          ok: true,
          profile: updatedProfile,
          storage: 'firestore',
          projectId: GCP_PROJECT_ID,
        });
      } catch {
        firestoreUnavailable = true;
      }
    }

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
      storage: 'memory-fallback',
      projectId: GCP_PROJECT_ID,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Invalid progress payload',
      },
      { status: 400 }
    );
  }
}
