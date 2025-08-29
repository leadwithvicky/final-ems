import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

// POST /api/employees/[id]/exit
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { resignationReason, lastWorkingDay, clearanceStatus } = body;

    const employee = await Employee.findByIdAndUpdate(
      params.id,
      {
        $set: {
          status: 'resigned',
          isActive: false,
          exitInfo: {
            resignationReason,
            lastWorkingDay,
            clearanceStatus: clearanceStatus ?? 'pending'
          }
        }
      },
      { new: true }
    );

    if (!employee) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


