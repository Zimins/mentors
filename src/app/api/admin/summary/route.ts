import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/admin/adminStore';
import { generateLearnerDiagnosticReport } from '@/lib/gemini/mentorSummaryAgent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'demo-scholar-01', mentorId = 'cs-professor' } = body || {};

    const learner = adminStore.getLearner(userId);
    if (!learner) {
      return NextResponse.json(
        { ok: false, error: `Learner '${userId}' not found` },
        { status: 404 }
      );
    }

    const submissions = adminStore.getSubmissions(userId);
    const sessionLogs = adminStore.getSessionLogs(userId);
    const promptConfig = adminStore.getPromptConfig(mentorId);
    const customDirective = promptConfig?.studentDirectives?.[userId];

    const report = await generateLearnerDiagnosticReport({
      userId,
      mentorId,
      learner,
      submissions,
      sessionLogs,
      customDirective,
    });

    adminStore.saveDiagnosticReport(report);

    return NextResponse.json({
      ok: true,
      report,
    });
  } catch (error) {
    console.error('[/api/admin/summary] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to generate diagnostic report' },
      { status: 500 }
    );
  }
}
