import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Poll from '@/lib/models/Poll';
import PollResponse from '@/lib/models/PollResponse';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Delete responses first to reduce storage, then the poll
    await PollResponse.deleteMany({ pollId: params.id });
    const res = await Poll.findByIdAndDelete(params.id);
    if (!res) return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}


