import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

// POST /api/employees/[id]/transfer
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
    const { toDepartment, reason } = body;
    if (!toDepartment) return NextResponse.json({ message: 'toDepartment is required' }, { status: 400 });

    const employee = await Employee.findById(params.id);
    if (!employee) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const fromDepartment = employee.department;
    employee.department = toDepartment;
    employee.transferHistory = employee.transferHistory || [];
    employee.transferHistory.push({ fromDepartment, toDepartment, reason, transferredAt: new Date() });
    await employee.save();

    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


