import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'No token provided' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { bonus, allowances, deductions, note, reason } = body || {};

    const payroll = await Payroll.findById(params.id);
    if (!payroll) return NextResponse.json({ message: 'Payroll not found' }, { status: 404 });

    // Block if finalized/paid unless superadmin
    if ((payroll.status === 'finalized' || payroll.status === 'paid') && decoded.role !== 'superadmin') {
      return NextResponse.json({ message: `Cannot adjust ${payroll.status} payroll. Contact a superadmin to override.` }, { status: 400 });
    }

    // Apply selective adjustments (only provided fields)
    if (typeof bonus === 'number') payroll.bonus = Math.max(0, Math.round(bonus));
    if (allowances && typeof allowances === 'object') {
      payroll.allowances = {
        housing: typeof allowances.housing === 'number' ? Math.max(0, Math.round(allowances.housing)) : (payroll.allowances?.housing || 0),
        transport: typeof allowances.transport === 'number' ? Math.max(0, Math.round(allowances.transport)) : (payroll.allowances?.transport || 0),
        meal: typeof allowances.meal === 'number' ? Math.max(0, Math.round(allowances.meal)) : (payroll.allowances?.meal || 0),
        other: typeof allowances.other === 'number' ? Math.max(0, Math.round(allowances.other)) : (payroll.allowances?.other || 0)
      } as any;
    }
    if (deductions && typeof deductions === 'object') {
      payroll.deductions = {
        tax: typeof deductions.tax === 'number' ? Math.max(0, Math.round(deductions.tax)) : (payroll.deductions?.tax || 0),
        insurance: typeof deductions.insurance === 'number' ? Math.max(0, Math.round(deductions.insurance)) : (payroll.deductions?.insurance || 0),
        pension: typeof deductions.pension === 'number' ? Math.max(0, Math.round(deductions.pension)) : (payroll.deductions?.pension || 0),
        other: typeof deductions.other === 'number' ? Math.max(0, Math.round(deductions.other)) : (payroll.deductions?.other || 0)
      } as any;
    }

    if (typeof note === 'string') payroll.notes = note;

    // Audit + status
    payroll.status = 'processed';
    (payroll as any).recomputedBy = decoded.id as any;
    (payroll as any).recomputedAt = new Date();
    (payroll as any).recomputeReason = reason || 'Manual adjustment';

    await payroll.save();

    return NextResponse.json({ message: 'Payroll adjusted', payroll });
  } catch (error) {
    console.error('Error adjusting payroll:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
