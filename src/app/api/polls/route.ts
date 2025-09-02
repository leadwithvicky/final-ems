import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Poll from '@/lib/models/Poll';
import PollResponse from '@/lib/models/PollResponse';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const polls: any[] = await Poll.find(status ? { status } : {}).sort({ createdAt: -1 }).lean() as any[];

    // Optional enrich with hasVoted for current employee
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = token ? verifyToken(token) : null;
    if (decoded && decoded.role === 'employee') {
      const employeeDoc = await Employee.findOne({ user: decoded.id }).lean();
      if (employeeDoc) {
        const list = Array.isArray(polls) ? polls : [];
        // Fetch all responses by this employee; we'll mark any matching poll ids
        const responses = await PollResponse.find({ employeeId: (employeeDoc as any)._id }).lean();
        const votedSet = new Set(
          Array.isArray(responses)
            ? responses.map((r: any) => String(r.pollId))
            : []
        );
        const enriched = list.map((p: any) => ({
          ...p,
          hasVoted: votedSet.has(String((p as any)._id)),
        }));
        return NextResponse.json(enriched);
      }
    }

    return NextResponse.json(polls);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const poll = await Poll.create({
      question: body.question,
      type: body.type,
      options: body.options,
      isAnonymousAllowed: !!body.isAnonymousAllowed,
      createdBy: decoded.id
    });
    return NextResponse.json(poll, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}


