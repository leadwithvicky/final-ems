import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Poll from '@/lib/models/Poll';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    const poll = await Poll.findByIdAndUpdate(params.id, { status: 'closed' }, { new: true });
    if (!poll) return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
    return NextResponse.json(poll);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}


