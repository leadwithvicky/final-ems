import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Leave from '@/lib/models/Leave';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { leaveId: string } }) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const leave = await Leave.findById(params.leaveId);
    if (!leave) {
      return NextResponse.json({ message: 'Leave not found' }, { status: 404 });
    }
    if (leave.status === 'rejected') {
      return NextResponse.json({ message: 'Leave already rejected' }, { status: 400 });
    }
    if (leave.status === 'approved') {
      return NextResponse.json({ message: 'Leave already approved; cannot reject' }, { status: 400 });
    }

    leave.status = 'rejected';
    leave.approvedBy = decoded.id;
    leave.approvedDate = new Date();
    await leave.save();

    return NextResponse.json({ message: 'Leave rejected.' });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


