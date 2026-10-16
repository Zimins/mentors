import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/admin/adminStore';
import { MENTORS } from '@/data/mentors';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const mentorId = req.nextUrl.searchParams.get('mentorId') || undefined;
    const learner = adminStore.getLearner(userId);

    if (!learner) {
      return NextResponse.json(
        { ok: false, error: 'Learner not found' },
        { status: 404 }
      );
    }

    const allSubmissions = adminStore.getSubmissions(userId);
    const allSessionLogs = adminStore.getSessionLogs(userId);
    const submissions = mentorId
      ? adminStore.getSubmissions(userId, mentorId)
      : allSubmissions;
    const sessionLogs = mentorId
      ? adminStore.getSessionLogs(userId, mentorId)
      : allSessionLogs;
    const diagnosticReport = adminStore.getDiagnosticReport(userId, mentorId);

    // Compute active & engaged mentors metadata
    const engagedMentorIds = Array.from(
      new Set([
        ...(learner.engagedMentorIds || []),
        ...Object.keys(learner.mentorLevels || {}),
        ...allSubmissions.map((s) => s.mentorId),
        ...allSessionLogs.map((l) => l.mentorId),
      ])
    ).filter(Boolean);

    const engagedMentors = MENTORS.filter((m) =>
      engagedMentorIds.includes(m.id)
    ).map((m) => {
      const mentorSubmissions = allSubmissions.filter((s) => s.mentorId === m.id);
      const correctCount = mentorSubmissions.filter((s) => s.isCorrect).length;
      const accuracyRate = mentorSubmissions.length > 0
        ? Math.round((correctCount / mentorSubmissions.length) * 100)
        : null;

      return {
        id: m.id,
        name: m.name,
        roleTitle: m.roleTitle,
        subject: m.subject,
        shortTag: m.shortTag,
        accentColor: m.accentColor,
        secondaryColor: m.secondaryColor,
        studentLevel: learner.mentorLevels[m.id] || 'unassessed',
        submissionCount: mentorSubmissions.length,
        correctCount,
        accuracyRate,
        logCount: allSessionLogs.filter((l) => l.mentorId === m.id).length,
      };
    });

    return NextResponse.json({
      ok: true,
      learner: {
        ...learner,
        activeMentorId: learner.activeMentorId || engagedMentorIds[0] || 'cs-professor',
        engagedMentorIds,
      },
      engagedMentors,
      submissions,
      sessionLogs,
      allSubmissions,
      allSessionLogs,
      diagnosticReport: diagnosticReport || null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch learner detail' },
      { status: 500 }
    );
  }
}
