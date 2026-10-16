import { NextRequest, NextResponse } from 'next/server';
import { adminStore } from '@/lib/admin/adminStore';
import { ReferenceMaterial } from '@/types/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');
    const references = adminStore.getReferences(mentorId || undefined);

    return NextResponse.json({ ok: true, references });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch references' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      mentorId = 'cs-professor',
      title,
      category = 'architecture_guide',
      content,
      tags = [],
    } = body || {};

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const refId = id || `ref-${Date.now()}`;
    const newRef: ReferenceMaterial = {
      id: refId,
      mentorId,
      title,
      category,
      content,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    adminStore.saveReference(newRef);

    return NextResponse.json({
      ok: true,
      reference: newRef,
      message: 'Reference material successfully saved to knowledge base.',
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to save reference' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Reference ID is required' },
        { status: 400 }
      );
    }

    adminStore.deleteReference(id);
    return NextResponse.json({ ok: true, message: 'Reference material deleted' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to delete reference' },
      { status: 500 }
    );
  }
}
