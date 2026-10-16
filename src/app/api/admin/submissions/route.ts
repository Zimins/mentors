import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/admin/adminStore';
import { QuizSubmissionRecord } from '@/types/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const submissions = adminStore.getSubmissions(userId || undefined);

    return NextResponse.json({
      ok: true,
      submissions,
      totalCount: submissions.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'demo-scholar-01',
      mentorId = 'cs-professor',
      channelSlug = 'general',
      questionText,
      options = [],
      selectedOptionIndex = 0,
      correctOptionIndex = 0,
      isCorrect = false,
      candyReward = 0,
      explanation = '',
    } = body || {};

    if (!questionText) {
      return NextResponse.json(
        { ok: false, error: 'questionText is required' },
        { status: 400 }
      );
    }

    const submission: QuizSubmissionRecord = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      mentorId,
      channelSlug,
      questionText,
      options: Array.isArray(options) ? options : [],
      selectedOptionIndex: Number(selectedOptionIndex),
      correctOptionIndex: Number(correctOptionIndex),
      isCorrect: Boolean(isCorrect),
      candyReward: Number(candyReward),
      submittedAt: new Date().toISOString(),
      explanation,
    };

    adminStore.recordSubmission(submission);

    return NextResponse.json({
      ok: true,
      submission,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to record submission' },
      { status: 500 }
    );
  }
}
