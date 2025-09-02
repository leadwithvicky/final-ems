import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Poll from '@/lib/models/Poll';
import PollResponse from '@/lib/models/PollResponse';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (decoded.role !== 'employee') {
      return NextResponse.json({ message: 'Only employees can vote' }, { status: 403 });
    }

    const poll = await Poll.findById(params.id);
    if (!poll) return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
    if (poll.status !== 'active') return NextResponse.json({ message: 'Poll is closed' }, { status: 400 });

    const body = await req.json();
    const answer = body.answer;

    let employeeId: any = undefined;
    if (!body.anonymous) {
      const employeeDoc = await Employee.findOne({ user: decoded.id });
      if (employeeDoc) employeeId = employeeDoc._id;
    }

    // Enforce single response for identified employee; return already voted if exists
    if (employeeId) {
      const existing = await PollResponse.findOne({ pollId: poll._id, employeeId });
      if (existing) {
        return NextResponse.json({ ok: true, alreadyVoted: true });
      }
      await PollResponse.create({ pollId: poll._id, employeeId, answer });
    } else {
      // Anonymous allowed only once per session is not enforced; admin can disable by disallowing anonymous
      await PollResponse.create({ pollId: poll._id, answer });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}


