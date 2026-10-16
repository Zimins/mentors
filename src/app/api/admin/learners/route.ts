import { NextResponse } from 'next/server';
import { adminStore } from '@/lib/admin/adminStore';

export async function GET() {
  try {
    const learners = adminStore.getLearners();
    return NextResponse.json({
      ok: true,
      learners,
      totalCount: learners.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch learners' },
      { status: 500 }
    );
  }
}
