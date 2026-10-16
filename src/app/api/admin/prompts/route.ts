import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/admin/adminStore';
import { MentorPromptConfig } from '@/types/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');

    if (mentorId) {
      const config = adminStore.getPromptConfig(mentorId);
      return NextResponse.json({ ok: true, config });
    }

    const configs = adminStore.getAllPromptConfigs();
    return NextResponse.json({ ok: true, configs });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch prompt configs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mentorId,
      systemPersona,
      diagnosticGuidelines,
      studentDirectives,
      updatedBy = 'Human Expert Admin',
    } = body || {};

    if (!mentorId || !systemPersona) {
      return NextResponse.json(
        { ok: false, error: 'mentorId and systemPersona are required' },
        { status: 400 }
      );
    }

    const existing = adminStore.getPromptConfig(mentorId);
    const updated: MentorPromptConfig = {
      mentorId,
      systemPersona,
      diagnosticGuidelines: diagnosticGuidelines || existing?.diagnosticGuidelines || '',
      studentDirectives: studentDirectives || existing?.studentDirectives || {},
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    adminStore.savePromptConfig(updated);

    return NextResponse.json({
      ok: true,
      config: updated,
      message: `Prompt config for ${mentorId} successfully updated.`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to save prompt config' },
      { status: 500 }
    );
  }
}
