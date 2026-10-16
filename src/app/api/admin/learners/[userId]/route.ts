import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/admin/adminStore';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const learner = adminStore.getLearner(userId);

    if (!learner) {
      return NextResponse.json(
        { ok: false, error: 'Learner not found' },
        { status: 404 }
      );
    }

    const submissions = adminStore.getSubmissions(userId);
    const sessionLogs = adminStore.getSessionLogs(userId);
    const diagnosticReport = adminStore.getDiagnosticReport(userId);

    return NextResponse.json({
      ok: true,
      learner,
      submissions,
      sessionLogs,
      diagnosticReport: diagnosticReport || null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch learner detail' },
      { status: 500 }
    );
  }
}
