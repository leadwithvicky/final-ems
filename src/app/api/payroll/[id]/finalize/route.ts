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

    const { notes } = await request.json();

    const payroll = await Payroll.findById(params.id);
    if (!payroll) {
      return NextResponse.json({ message: 'Payroll not found' }, { status: 404 });
    }

    // Only allow finalizing processed payroll
    if (payroll.status !== 'processed') {
      return NextResponse.json({ 
        message: `Cannot finalize payroll with status: ${payroll.status}. Only 'processed' payroll can be finalized.` 
      }, { status: 400 });
    }

    payroll.status = 'finalized';
    if (notes) {
      payroll.notes = notes;
    }

    await payroll.save();

    return NextResponse.json({ 
      message: 'Payroll finalized successfully',
      payroll: {
        id: payroll._id,
        status: payroll.status,
        finalizedAt: payroll.updatedAt
      }
    });
  } catch (error) {
    console.error('Error finalizing payroll:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
