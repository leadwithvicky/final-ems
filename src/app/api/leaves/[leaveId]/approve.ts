import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Leave from '@/lib/models/Leave';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { leaveId: string } }) {
  try {
    await connectDB();

    // Verify token
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
    if (leave.status === 'approved') {
      return NextResponse.json({ message: 'Leave already approved' }, { status: 400 });
    }

    // Approve leave
    leave.status = 'approved';
    leave.approvedBy = decoded.id;
    leave.approvedDate = new Date();
    await leave.save();

    // Increment usedLeaves for the employee
    const employee = await Employee.findById(leave.employee);
    if (employee) {
      employee.usedLeaves = (employee.usedLeaves || 0) + leave.days;
      await employee.save();
    }

    return NextResponse.json({ message: 'Leave approved and usedLeaves updated.' });
  } catch (error) {
    console.error('Error approving leave:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
