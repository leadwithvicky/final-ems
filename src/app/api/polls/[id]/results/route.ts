import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Poll from '@/lib/models/Poll';
import PollResponse from '@/lib/models/PollResponse';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const poll = await Poll.findById(params.id);
    if (!poll) return NextResponse.json({ message: 'Poll not found' }, { status: 404 });

    const responses = await PollResponse.find({ pollId: poll._id }).lean();
    // Unique participant count: unique employeeIds plus anonymous submissions counted as 1 bucket
    const uniqueEmployeeIds = new Set(responses.filter(r => r.employeeId).map(r => String(r.employeeId)));
    const hasAnonymous = responses.some(r => !r.employeeId);
    const participants = uniqueEmployeeIds.size + (hasAnonymous ? 1 : 0);
    const total = responses.length;
    let breakdown: any = {};

    if (poll.type === 'mcq' || poll.type === 'yesno') {
      (poll.options || []).forEach((opt: string) => { breakdown[opt] = 0; });
      responses.forEach(r => { breakdown[r.answer as any] = (breakdown[r.answer as any] || 0) + 1; });
    } else if (poll.type === 'rating') {
      breakdown = { 1:0,2:0,3:0,4:0,5:0 } as any;
      responses.forEach(r => { const v = Number(r.answer) || 0; if (v>=1 && v<=5) breakdown[v] += 1; });
    } else {
      breakdown = { texts: responses.map(r => String(r.answer)) };
    }

    // naive keyword extraction for text answers
    let keywords: Array<{ word: string; count: number }> = [];
    if (poll.type === 'text') {
      const stop = new Set(['the','and','is','to','of','in','a','for','on','with','this','that','it','be','are','as','at','by','or','an','from']);
      const counts: Record<string, number> = {};
      (breakdown.texts || []).forEach((t: string) => {
        t.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).forEach(w => {
          if (!w || stop.has(w) || w.length < 3) return; counts[w] = (counts[w]||0)+1;
        });
      });
      keywords = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([word,count])=>({ word, count: count as number }));
    }

    // If admin/superadmin and anonymity is disabled, include voter list
    let voters: Array<{ name: string; department?: string; answer: any }> | undefined;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = token ? verifyToken(token) : null;
    if ((decoded?.role === 'admin' || decoded?.role === 'superadmin') && !poll.isAnonymousAllowed) {
      const identified = responses.filter(r => r.employeeId);
      const employeeIds = identified.map(r => r.employeeId);
      const emps = await Employee.find({ _id: { $in: employeeIds } }, { firstName: 1, lastName: 1, department: 1 }).lean();
      const map = new Map(emps.map(e => [String(e._id), e]));
      voters = identified.map(r => {
        const e: any = map.get(String(r.employeeId));
        return { name: e ? `${e.firstName} ${e.lastName}` : 'Employee', department: e?.department, answer: r.answer };
      });
    }

    return NextResponse.json({ poll, total, participants, breakdown, keywords, voters });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}


