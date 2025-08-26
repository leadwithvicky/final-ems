import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'No token provided' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const payroll = await Payroll.findById(params.id);
    if (!payroll) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    payroll.status = 'paid';
    payroll.paymentDate = new Date();
    await payroll.save();

    return NextResponse.json({ message: 'Marked as paid' });
  } catch (error) {
    console.error('Error marking payroll paid:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


